/**
 * Government College ERP System - Backend Code.gs
 */

// Serve the frontend web page
function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
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
    
    // We assume the form submissions are in the following order in Master Responses sheet:
    // Timestamp, Name, Email, CAPID, Index Mark, Reservation Category, Actual Category, Religion, Caste, Annual Income, Additional Languages, Photograph Drive URL, Department
    // (Ensure department is the last field or we extract it correctly)
    // For safety, let's find the department field.
    var masterSheet = sheet.getSheetByName("Master Responses") || sheet.getSheets()[0];
    var headers = masterSheet.getRange(1, 1, 1, masterSheet.getLastColumn()).getValues()[0];
    
    var deptIndex = headers.indexOf("Department");
    if (deptIndex === -1) {
      // Fallback/guess index (e.g., last column or column 12/13)
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
      var extraHeaders = ["Current_Status", "Faculty_Remarks", "Nodal_Remarks", "PTA_Amount", "Principal_Remarks", "Admission_Number", "Token_Number", "DOB", "Joined_Semester", "Leaving_Semester", "Promotion_Status", "Dues_Status", "Leaving_Date", "Application_Date", "Issue_Date", "Conduct", "PTA_Prog_Fee", "PTA_Cat_Fee", "PTA_Custom_Fee"];
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
      var requiredCols = ["Current_Status", "Faculty_Remarks", "Nodal_Remarks", "PTA_Amount", "Principal_Remarks", "Admission_Number", "Token_Number", "DOB", "Joined_Semester", "Leaving_Semester", "Promotion_Status", "Dues_Status", "Leaving_Date", "Application_Date", "Issue_Date", "Conduct", "PTA_Prog_Fee", "PTA_Cat_Fee", "PTA_Custom_Fee"];
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
      if (name !== "Master Responses" && name !== "Sheet1") {
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
    var capidIndex = headers.indexOf("CAPID");
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
      var deptCode = getDeptCode(department);
      // Fetch all tokens to find the next sequential number to prevent duplicates
      var allTokens = [];
      if (tokenIndex !== -1) {
        allTokens = deptSheet.getRange(2, tokenIndex + 1, lastRow - 1, 1).getValues().map(function(row) {
          return row[0] ? row[0].toString().trim() : "";
        });
      }
      
      var maxNum = 0;
      allTokens.forEach(function(tok) {
        if (tok && tok.indexOf(deptCode + "-") === 0) {
          var numPart = parseInt(tok.split("-")[1], 10);
          if (!isNaN(numPart) && numPart > maxNum) {
            maxNum = numPart;
          }
        }
      });
      
      var nextNum = maxNum + 1;
      // Pad to 3 digits (e.g. CS-001)
      var paddedNum = ("000" + nextNum).slice(-3);
      tokenGenerated = deptCode + "-" + paddedNum;
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
  }
}

// Personal credentials validation using a 'Credentials' tab in Google Sheets
function validateCredentials(role, department, password) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var credSheet = sheet.getSheetByName("Credentials");
    
    // Auto-create Credentials sheet with defaults if it doesn't exist
    if (!credSheet) {
      credSheet = sheet.insertSheet("Credentials");
      var headers = ["Role", "Department", "Password"];
      credSheet.appendRow(headers);
      
      // Default credentials rows
      var defaults = [
        ["Principal", "", "principal123"],
        ["Nodal Officer", "", "nodal123"],
        ["PTA", "", "pta123"],
        ["Faculty", "Computer Science", "facultycs123"],
        ["Faculty", "Physics", "facultyph123"],
        ["Faculty", "Chemistry", "facultych123"],
        ["Faculty", "Mathematics", "facultyma123"],
        ["Faculty", "Commerce", "facultyco123"],
        ["HOD", "Computer Science", "hodcs123"],
        ["HOD", "Physics", "hodph123"]
      ];
      
      defaults.forEach(function(row) {
        credSheet.appendRow(row);
      });
      
      // Style headers
      var headerRange = credSheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f1f3f4");
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
        // If it's a department-specific role (Faculty or HOD), check department match
        if (role === "Faculty" || role === "HOD") {
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

