/**
 * Government College ERP System - Backend Code.gs
 */

// Serve the frontend web page
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Government College ERP Portal')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Map department names to short codes for Token Generation
function getDeptCode(deptName) {
  if (!deptName) return 'GEN';
  var cleaned = deptName.trim().toUpperCase();
  if (cleaned.indexOf('COMPUTER') > -1) return 'CS';
  if (cleaned.indexOf('PHYSICS') > -1) return 'PH';
  if (cleaned.indexOf('CHEMISTRY') > -1) return 'CH';
  if (cleaned.indexOf('MATHEMATICS') > -1) return 'MA';
  if (cleaned.indexOf('COMMERCE') > -1) return 'CO';
  if (cleaned.indexOf('ENGLISH') > -1) return 'EN';
  if (cleaned.indexOf('BOTANY') > -1) return 'BO';
  if (cleaned.indexOf('ECONOMICS') > -1) return 'EC';
  if (cleaned.indexOf('HINDI') > -1) return 'HI';
  if (cleaned.indexOf('HISTORY') > -1) return 'HS';
  if (cleaned.indexOf('MALAYALAM') > -1) return 'ML';
  if (cleaned.indexOf('PSYCHOLOGY') > -1) return 'PY';
  if (cleaned.indexOf('SANSKRIT') > -1) return 'SK';
  if (cleaned.indexOf('STATISTICS') > -1) return 'ST';
  if (cleaned.indexOf('TAMIL') > -1) return 'TM';
  if (cleaned.indexOf('ZOOLOGY') > -1) return 'ZO';
  
  // Fallback to first letters or substring
  var words = cleaned.split(/\s+/);
  if (words.length > 1) {
    return (words[0][0] + words[1][0]).substring(0, 3);
  }
  return cleaned.substring(0, 3);
}

// onFormSubmit Trigger: Copies new submissions from Master Responses to Department tabs
function onFormSubmit(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var responseValues;
    
    // Check if triggered by installable form submit trigger or standard event
    if (e && e.values) {
      responseValues = e.values;
    } else if (e && e.range) {
      responseValues = e.range.getValues()[0];
    } else {
      Logger.log("No event values found.");
      return;
    }
    
    // Raw Form Headers mapping. We search for 'Admission to the Department' to route the student.
    var masterSheet = sheet.getSheetByName("Master Responses") || sheet.getSheets()[0];
    var headers = masterSheet.getRange(1, 1, 1, masterSheet.getLastColumn()).getValues()[0];
    
    var deptIndex = headers.indexOf("Admission to the Department");
    if (deptIndex === -1) {
      deptIndex = headers.indexOf("Department");
    }
    if (deptIndex === -1) {
      deptIndex = responseValues.length - 1; 
    }
    
    var deptName = responseValues[deptIndex];
    if (!deptName) {
      Logger.log("Department is empty.");
      return;
    }
    
    deptName = deptName.toString().trim();
    var deptSheet = sheet.getSheetByName(deptName);
    
    // Create Department tab if it doesn't exist
    if (!deptSheet) {
      deptSheet = sheet.insertSheet(deptName);
      // Copy headers from master
      var deptHeaders = [].concat(headers);
      // Append workflow and TC headers
      var extraHeaders = ["Current_Status", "Faculty_Remarks", "Nodal_Remarks", "PTA_Amount", "Principal_Remarks", "Admission_Number", "Token_Number", "DOB", "Joined_Semester", "Leaving_Semester", "Promotion_Status", "Dues_Status", "Leaving_Date", "Application_Date", "Issue_Date", "Conduct", "PTA_Welfare_Fund", "PTA_Membership", "PTA_Donation", "Program_Type", "Assigned_Slot"];
      deptHeaders = deptHeaders.concat(extraHeaders);
      deptSheet.appendRow(deptHeaders);
      
      // Style headers
      var headerRange = deptSheet.getRange(1, 1, 1, deptHeaders.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#1a73e8");
      headerRange.setFontColor("#ffffff");
    } else {
      // Ensure workflow and TC columns exist in the header row
      var deptHeadersRange = deptSheet.getRange(1, 1, 1, deptSheet.getLastColumn());
      var deptHeaders = deptHeadersRange.getValues()[0];
      var requiredCols = ["Current_Status", "Faculty_Remarks", "Nodal_Remarks", "PTA_Amount", "Principal_Remarks", "Admission_Number", "Token_Number", "DOB", "Joined_Semester", "Leaving_Semester", "Promotion_Status", "Dues_Status", "Leaving_Date", "Application_Date", "Issue_Date", "Conduct", "PTA_Welfare_Fund", "PTA_Membership", "PTA_Donation", "Program_Type", "Assigned_Slot"];
      var modified = false;
      
      requiredCols.forEach(function(col) {
        if (deptHeaders.indexOf(col) === -1) {
          deptHeaders.push(col);
          modified = true;
        }
      });
      
      if (modified) {
        // Clear and rewrite headers to ensure layout matches
        deptSheet.getRange(1, 1, 1, deptHeaders.length).setValues([deptHeaders]);
        var newHeaderRange = deptSheet.getRange(1, 1, 1, deptHeaders.length);
        newHeaderRange.setFontWeight("bold");
        newHeaderRange.setBackground("#1a73e8");
        newHeaderRange.setFontColor("#ffffff");
      }
    }
    
    // Read final headers to map properly
    var finalHeaders = deptSheet.getRange(1, 1, 1, deptSheet.getLastColumn()).getValues()[0];
    
    // Prepare row to insert
    var newRow = [];
    for (var i = 0; i < finalHeaders.length; i++) {
      var headerName = finalHeaders[i];
      var masterColIndex = headers.indexOf(headerName);
      
      if (masterColIndex !== -1) {
        newRow.push(responseValues[masterColIndex] || "");
      } else {
        // It's a workflow column. Default status is Pending_Faculty
        if (headerName === "Current_Status") {
          newRow.push("Pending_Faculty");
        } else {
          newRow.push("");
        }
      }
    }
    
    deptSheet.appendRow(newRow);
    Logger.log("Successfully copied form submission to " + deptName);
    
  } catch (error) {
    Logger.log("Error in onFormSubmit: " + error.toString());
  }
}

// Fetch all student records for a department
function getDepartmentData(department) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var deptSheet = sheet.getSheetByName(department);
    
    if (!deptSheet) {
      return JSON.stringify({ success: false, message: "Department tab '" + department + "' not found." });
    }
    
    var lastRow = deptSheet.getLastRow();
    if (lastRow < 2) {
      return JSON.stringify({ success: true, data: [] });
    }
    
    var range = deptSheet.getRange(1, 1, lastRow, deptSheet.getLastColumn());
    var values = range.getValues();
    var headers = values[0];
    
    var data = [];
    for (var r = 1; r < values.length; r++) {
      var rowObj = {};
      for (var c = 0; c < headers.length; c++) {
        rowObj[headers[c]] = values[r][c];
      }
      data.push(rowObj);
    }
    
    return JSON.stringify({ success: true, data: data });
  } catch (error) {
    return JSON.stringify({ success: false, message: error.toString() });
  }
}

// Helper to list all sheets/departments (useful for dropdown selections)
function getDepartmentsList() {
  try {
    var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
    var depts = [];
    for (var i = 0; i < sheets.length; i++) {
      var name = sheets[i].getName();
      if (name !== "Master Responses" && name !== "Sheet1" && name !== "Credentials" && name !== "PTA_Config" && name !== "Seat_Matrix") {
        depts.push(name);
      }
    }
    return JSON.stringify({ success: true, departments: depts });
  } catch (error) {
    return JSON.stringify({ success: false, message: error.toString() });
  }
}

// Update student data and handle state transitions
function updateStudentData(department, capid, updatedData) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Wait up to 10 seconds for other processes
  } catch (e) {
    return JSON.stringify({ success: false, message: "System is busy. Please try again in a few seconds." });
  }
  
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var deptSheet = sheet.getSheetByName(department);
    if (!deptSheet) {
      return JSON.stringify({ success: false, message: "Department sheet not found." });
    }
    
    var lastRow = deptSheet.getLastRow();
    if (lastRow < 2) {
      return JSON.stringify({ success: false, message: "No students in this department." });
    }
    
    var headers = deptSheet.getRange(1, 1, 1, deptSheet.getLastColumn()).getValues()[0];
    var capidIndex = headers.indexOf("CAP id (Enter the full cap id without any spaces)");
    if (capidIndex === -1) {
      capidIndex = headers.indexOf("CAPID");
    }
    if (capidIndex === -1) {
      return JSON.stringify({ success: false, message: "CAPID column not found." });
    }
    
    var capidValues = deptSheet.getRange(2, capidIndex + 1, lastRow - 1, 1).getValues();
    var targetRowIndex = -1;
    for (var i = 0; i < capidValues.length; i++) {
      if (capidValues[i][0].toString().trim() === capid.toString().trim()) {
        targetRowIndex = i + 2; // 1-based, skipping headers
        break;
      }
    }
    
    if (targetRowIndex === -1) {
      return JSON.stringify({ success: false, message: "Student with CAPID " + capid + " not found." });
    }
    
    // Check if we need to generate a token (if transitioning from Faculty Verification)
    var currentStatusIndex = headers.indexOf("Current_Status");
    var tokenIndex = headers.indexOf("Token_Number");
    
    // Get existing values to check current status
    var existingRow = deptSheet.getRange(targetRowIndex, 1, 1, headers.length).getValues()[0];
    var prevStatus = currentStatusIndex !== -1 ? existingRow[currentStatusIndex] : "";
    var existingToken = tokenIndex !== -1 ? existingRow[tokenIndex] : "";
    
    var nextStatus = updatedData["Current_Status"] || prevStatus;
    var tokenGenerated = existingToken;
    
    // Logic: If status transitions from Faculty to Nodal, generate a token if not already exists
    if (nextStatus === "Pending_Nodal" && !existingToken) {
      var prefix = "T";
      // Fetch all tokens to find the next sequential number to prevent duplicates
      var allTokens = [];
      if (tokenIndex !== -1) {
        allTokens = deptSheet.getRange(2, tokenIndex + 1, lastRow - 1, 1).getValues().map(function(row) {
          return row[0] ? row[0].toString().trim() : "";
        });
      }
      
      var maxNum = 0;
      allTokens.forEach(function(tok) {
        if (tok && tok.indexOf(prefix + "-") === 0) {
          var numPart = parseInt(tok.split("-")[1], 10);
          if (!isNaN(numPart) && numPart > maxNum) {
            maxNum = numPart;
          }
        }
      });
      
      var nextNum = maxNum + 1;
      // Pad to 3 digits (e.g. T-001)
      var paddedNum = ("000" + nextNum).slice(-3);
      tokenGenerated = prefix + "-" + paddedNum;
      updatedData["Token_Number"] = tokenGenerated;
    }
    
    // Update the sheet cells
    var rowRange = deptSheet.getRange(targetRowIndex, 1, 1, headers.length);
    var rowValues = rowRange.getValues()[0];
    
    for (var col = 0; col < headers.length; col++) {
      var headerName = headers[col];
      if (updatedData.hasOwnProperty(headerName)) {
        rowValues[col] = updatedData[headerName];
      }
    }
    
    rowRange.setValues([rowValues]);
    
    return JSON.stringify({ 
      success: true, 
      message: "Student data updated successfully.", 
      token: tokenGenerated, 
      status: nextStatus 
    });
    
  } catch (error) {
    return JSON.stringify({ success: false, message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

// Personal credentials validation using a 'Credentials' tab in Google Sheets
function validateCredentials(role, department, password) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var credSheet = sheet.getSheetByName("Credentials");
    var needInit = false;
    
    // Auto-create/populate Credentials sheet with defaults if it doesn't exist or is empty
    if (!credSheet) {
      credSheet = sheet.insertSheet("Credentials");
      needInit = true;
    } else if (credSheet.getLastRow() < 2) {
      needInit = true;
    }
    
    var departmentsList = [
      "Botany", "Chemistry", "Commerce", "Computer Science", "English",
      "Economics", "Hindi", "History", "Malayalam", "Mathematics",
      "Physics", "Psychology", "Sanskrit", "Statistics", "Tamil", "Zoology"
    ];
    
    if (needInit) {
      credSheet.clear();
      var headers = ["Role", "Department", "Password"];
      credSheet.appendRow(headers);
      
      // Default credentials rows for all 16 departments
      var defaults = [
        ["Principal", "", "principal123"],
        ["Nodal Officer", "", "nodal123"],
        ["PTA", "", "pta123"]
      ];
      
      departmentsList.forEach(function(d) {
        var cleanCode = getDeptCode(d).toLowerCase();
        defaults.push(["Faculty", d, "faculty" + cleanCode + "123"]);
      });
      
      defaults.forEach(function(row) {
        credSheet.appendRow(row);
      });
      
      // Style headers
      var headerRange = credSheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f1f3f4");
    } else {
      // Smart Sync: Only append missing credentials to preserve user modified passwords
      var lastRow = credSheet.getLastRow();
      var existingRows = credSheet.getRange(2, 1, lastRow - 1, 3).getValues();
      var existingKeys = {};
      
      existingRows.forEach(function(row) {
        var r = row[0] ? row[0].toString().trim() : "";
        var d = row[1] ? row[1].toString().trim() : "";
        existingKeys[r + "|" + d] = true;
      });
      
      var missingRows = [];
      
      // Check admin credentials
      var admins = [
        ["Principal", ""],
        ["Nodal Officer", ""],
        ["PTA", ""]
      ];
      
      admins.forEach(function(adm) {
        var key = adm[0] + "|";
        if (!existingKeys[key]) {
          var defaultPass = adm[0] === "Principal" ? "principal123" : (adm[0] === "Nodal Officer" ? "nodal123" : "pta123");
          missingRows.push([adm[0], "", defaultPass]);
        }
      });
      
      // Check department credentials
      departmentsList.forEach(function(d) {
        var key = "Faculty|" + d;
        if (!existingKeys[key]) {
          var cleanCode = getDeptCode(d).toLowerCase();
          missingRows.push(["Faculty", d, "faculty" + cleanCode + "123"]);
        }
      });
      
      if (missingRows.length > 0) {
        missingRows.forEach(function(row) {
          credSheet.appendRow(row);
        });
      }
    }
    
    var lastRow = credSheet.getLastRow();
    if (lastRow < 2) {
      return JSON.stringify({ success: false, message: "Credentials registry is empty." });
    }
    
    var data = credSheet.getRange(2, 1, lastRow - 1, 3).getValues();
    var validated = false;
    
    for (var i = 0; i < data.length; i++) {
      var dbRole = data[i][0] ? data[i][0].toString().trim() : "";
      var dbDept = data[i][1] ? data[i][1].toString().trim() : "";
      var dbPass = data[i][2] ? data[i][2].toString().trim() : "";
      
      if (dbRole === role && dbPass === password) {
        // If it's a department-specific role (Faculty), check department match
        if (role === "Faculty") {
          if (dbDept === department) {
            validated = true;
            break;
          }
        } else {
          // Central administrative roles do not need department match
          validated = true;
          break;
        }
      }
    }
    
    if (validated) {
      return JSON.stringify({ success: true });
    } else {
      return JSON.stringify({ success: false, message: "Invalid credentials or password." });
    }
  } catch (error) {
    return JSON.stringify({ success: false, message: error.toString() });
  }
}

// doPost Endpoint to serve requests from GitHub Pages (CORS compliant API)
function doPost(e) {
  try {
    var requestData;
    if (e && e.postData && e.postData.contents) {
      requestData = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      requestData = e.parameter;
    } else {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "No post data received." }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var action = requestData.action;
    var result;
    
    if (action === "getDepartmentsList") {
      result = JSON.parse(getDepartmentsList());
    } else if (action === "getDepartmentData") {
      result = JSON.parse(getDepartmentData(requestData.department));
    } else if (action === "validateCredentials") {
      result = JSON.parse(validateCredentials(requestData.role, requestData.department, requestData.password));
    } else if (action === "updateStudentData") {
      result = JSON.parse(updateStudentData(requestData.department, requestData.capid, requestData.updatedData));
    } else if (action === "getPTAConfig") {
      result = JSON.parse(getPTAConfig());
    } else if (action === "updatePTAConfig") {
      result = JSON.parse(updatePTAConfig(requestData.configData));
    } else if (action === "getAllDepartmentsData") {
      result = JSON.parse(getAllDepartmentsData());
    } else if (action === "getSeatMatrix") {
      result = JSON.parse(getSeatMatrix());
    } else if (action === "updateSeatMatrix") {
      result = JSON.parse(updateSeatMatrix(requestData.matrixData));
    } else {
      result = { success: false, message: "Unknown action: " + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Fetch PTA Config table from sheet, initializing defaults if needed
function getPTAConfig() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var configSheet = sheet.getSheetByName("PTA_Config");
    var needInit = false;
    
    if (!configSheet) {
      configSheet = sheet.insertSheet("PTA_Config");
      needInit = true;
    } else if (configSheet.getLastRow() < 2) {
      needInit = true;
    }
    
    if (needInit) {
      configSheet.clear();
      var headers = ["Program_Type", "Welfare_SCST", "Membership_SCST", "Donation_SCST", "Welfare_NonSCST", "Membership_NonSCST", "Donation_NonSCST"];
      configSheet.appendRow(headers);
      
      // Default program type mappings
      var defaults = [
        ["BA", 300, 50, 0, 1500, 500, 0],
        ["B.Sc.", 300, 50, 0, 2000, 500, 0],
        ["B.Com.", 300, 50, 0, 1500, 500, 0],
        ["MA", 300, 50, 0, 2000, 500, 0],
        ["M.Sc.", 300, 50, 0, 2500, 500, 0],
        ["M.Com.", 300, 50, 0, 2000, 500, 0],
        ["Ph.D.", 300, 50, 0, 3000, 500, 0]
      ];
      
      defaults.forEach(function(row) {
        configSheet.appendRow(row);
      });
      
      // Style headers
      var headerRange = configSheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f1f3f4");
    }
    
    var lastRow = configSheet.getLastRow();
    var dataRange = configSheet.getRange(1, 1, lastRow, configSheet.getLastColumn());
    var values = dataRange.getValues();
    var headers = values[0];
    
    var data = [];
    for (var r = 1; r < values.length; r++) {
      var rowObj = {};
      for (var c = 0; c < headers.length; c++) {
        rowObj[headers[c]] = values[r][c];
      }
      data.push(rowObj);
    }
    
    return JSON.stringify({ success: true, data: data });
  } catch (error) {
    return JSON.stringify({ success: false, message: error.toString() });
  }
}

// Update PTA Config settings
function updatePTAConfig(configData) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var configSheet = sheet.getSheetByName("PTA_Config");
    
    if (!configSheet) {
      configSheet = sheet.insertSheet("PTA_Config");
    }
    
    configSheet.clear();
    var headers = ["Program_Type", "Welfare_SCST", "Membership_SCST", "Donation_SCST", "Welfare_NonSCST", "Membership_NonSCST", "Donation_NonSCST"];
    configSheet.appendRow(headers);
    
    // Style headers
    var headerRange = configSheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#f1f3f4");
    
    configData.forEach(function(item) {
      var row = [
        item.Program_Type,
        item.Welfare_SCST,
        item.Membership_SCST,
        item.Donation_SCST,
        item.Welfare_NonSCST,
        item.Membership_NonSCST,
        item.Donation_NonSCST
      ];
      configSheet.appendRow(row);
    });
    
    return JSON.stringify({ success: true });
  } catch (error) {
    return JSON.stringify({ success: false, message: error.toString() });
  }
}

// Fetch all student records across all department sheets
function getAllDepartmentsData() {
  try {
    var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
    var allData = [];
    
    for (var i = 0; i < sheets.length; i++) {
      var name = sheets[i].getName();
      // Skip system sheets
      if (name !== "Master Responses" && name !== "Sheet1" && name !== "Credentials" && name !== "PTA_Config" && name !== "Seat_Matrix") {
        var deptDataJson = getDepartmentData(name);
        var res = JSON.parse(deptDataJson);
        if (res.success && res.data) {
          // Add department name to each student record
          res.data.forEach(function(student) {
            student["Department"] = name;
            allData.push(student);
          });
        }
      }
    }
    return JSON.stringify({ success: true, data: allData });
  } catch (error) {
    return JSON.stringify({ success: false, message: error.toString() });
  }
}

// Manual helper function to force sync missing credentials.
// You can run this directly in the Apps Script Editor by selecting it from the top dropdown and clicking 'Run'.
function syncCredentialsSheet() {
  var res = validateCredentials("Principal", "", "principal123");
  Logger.log("Credential Sync Result: " + res);
}

// Fetch Seat Matrix configuration
function getSeatMatrix() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var matrixSheet = sheet.getSheetByName("Seat_Matrix");
    var needInit = false;
    
    if (!matrixSheet) {
      matrixSheet = sheet.insertSheet("Seat_Matrix");
      needInit = true;
    } else if (matrixSheet.getLastRow() < 2) {
      needInit = true;
    }
    
    if (needInit) {
      matrixSheet.clear();
      var headers = ["Department", "Open", "SC", "ST", "OBC", "EWS", "OEC"];
      matrixSheet.appendRow(headers);
      
      var headerRange = matrixSheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f1f3f4");
    }
    
    // Auto-sync missing departments into the Seat_Matrix
    var lastRow = matrixSheet.getLastRow();
    var existingDepts = {};
    if (lastRow > 1) {
      var existingData = matrixSheet.getRange(2, 1, lastRow - 1, 1).getValues();
      existingData.forEach(function(row) {
        if (row[0]) existingDepts[row[0].toString().trim()] = true;
      });
    }
    
    var deptsRaw = getDepartmentsList();
    var deptsData = JSON.parse(deptsRaw);
    if (deptsData.success && deptsData.departments) {
      deptsData.departments.forEach(function(d) {
        if (!existingDepts[d]) {
          matrixSheet.appendRow([d, 0, 0, 0, 0, 0, 0]);
        }
      });
    }
    
    var lastRow = matrixSheet.getLastRow();
    if (lastRow < 2) return JSON.stringify({ success: true, data: [] });
    
    var dataRange = matrixSheet.getRange(1, 1, lastRow, matrixSheet.getLastColumn());
    var values = dataRange.getValues();
    var headers = values[0];
    
    var data = [];
    for (var r = 1; r < values.length; r++) {
      var rowObj = {};
      for (var c = 0; c < headers.length; c++) {
        rowObj[headers[c]] = values[r][c];
      }
      data.push(rowObj);
    }
    
    return JSON.stringify({ success: true, data: data });
  } catch (error) {
    return JSON.stringify({ success: false, message: error.toString() });
  }
}

// Update Seat Matrix data
function updateSeatMatrix(matrixData) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var matrixSheet = sheet.getSheetByName("Seat_Matrix");
    
    if (!matrixSheet) {
      matrixSheet = sheet.insertSheet("Seat_Matrix");
    }
    
    matrixSheet.clear();
    var headers = ["Department", "Open", "SC", "ST", "OBC", "EWS", "OEC"];
    matrixSheet.appendRow(headers);
    
    var headerRange = matrixSheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#f1f3f4");
    
    matrixData.forEach(function(item) {
      var row = [
        item.Department,
        item.Open || 0,
        item.SC || 0,
        item.ST || 0,
        item.OBC || 0,
        item.EWS || 0,
        item.OEC || 0
      ];
      matrixSheet.appendRow(row);
    });
    
    return JSON.stringify({ success: true });
  } catch (error) {
    return JSON.stringify({ success: false, message: error.toString() });
  }
}
