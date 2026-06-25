/**
 * Government Victoria College ERP System - Backend Code.gs
 */

// Global constants for sheet names and critical headers
var MASTER_SHEET_NAME = "Form Responses 1";
var MASTER_SHEET_FALLBACK = "Master Responses";
var SYSTEM_DB_SHEET_NAME = "System_DB";
var CREDENTIALS_SHEET_NAME = "Credentials";
var PTA_CONFIG_SHEET_NAME = "PTA_Config";
var SEAT_SPLIT_SHEET_NAME = "SeatSplitUp";

var KEY_HEADER = "CAP id (Enter the full cap id without any spaces)";
var EMAIL_HEADER = "Email Address";
var EMAIL_FALLBACK_HEADER = "Email id";
var DEPT_HEADER = "Admission to the Department";
var PROG_HEADER = "Admission to the Programme";

// Helper to identify system sheets
function isSystemSheet(name) {
  if (!name) return true;
  var cleanName = name.toString().trim().toLowerCase();
  var systemNames = [
    MASTER_SHEET_NAME.toLowerCase(),
    MASTER_SHEET_FALLBACK.toLowerCase(),
    SYSTEM_DB_SHEET_NAME.toLowerCase(),
    CREDENTIALS_SHEET_NAME.toLowerCase(),
    PTA_CONFIG_SHEET_NAME.toLowerCase(),
    SEAT_SPLIT_SHEET_NAME.toLowerCase(),
    "seatsplitup_ug",
    "audit_logs",
    "sheet1",
    "transposeseatsplitup",
    "cat",
    "master"
  ];
  return systemNames.indexOf(cleanName) !== -1;
}

// Helper to find a header index case-insensitively and trimmed to avoid spelling/space issues
function findHeaderIndex(headers, targetHeader) {
  if (!headers || !targetHeader) return -1;
  var targetClean = targetHeader.toString().trim().toLowerCase();
  for (var i = 0; i < headers.length; i++) {
    if (headers[i]) {
      var headerClean = headers[i].toString().trim().toLowerCase();
      if (headerClean === targetClean) {
        return i;
      }
    }
  }
  return -1;
}

// Helper to get master sheet dynamically
function getMasterSheet(sheet) {
  return sheet.getSheetByName(MASTER_SHEET_NAME) || 
         sheet.getSheetByName(MASTER_SHEET_FALLBACK) || 
         sheet.getSheets()[0];
}

// Serve the frontend web page
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Government College ERP Portal')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Map department names to short codes for Token/TC Generation
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
  
  var words = cleaned.split(/\s+/);
  if (words.length > 1) {
    return (words[0][0] + words[1][0]).substring(0, 3);
  }
  return cleaned.substring(0, 3);
}

// Get or create the System_DB sheet to hold system workflow attributes
function getOrCreateSystemDBSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var dbSheet = sheet.getSheetByName(SYSTEM_DB_SHEET_NAME);
  var dbHeaders = [
    "Student_Key", "CAPID", "Email", "Department", "Program",
    "Current_Status", "Faculty_Remarks", "Nodal_Remarks", "PTA_Amount", "Principal_Remarks", 
    "Admission_Number", "Token_Number", "Joined_Semester", "Leaving_Semester", 
    "Promotion_Status", "Dues_Status", "Leaving_Date", "Application_Date", 
    "Issue_Date", "Conduct", "PTA_Welfare_Fund", "PTA_Membership", "PTA_Donation", 
    "Program_Type", "Assigned_Slot", "Synced_Form_Department", "Verified_Index_Mark"
  ];
  
  if (!dbSheet) {
    dbSheet = sheet.insertSheet(SYSTEM_DB_SHEET_NAME);
    dbSheet.appendRow(dbHeaders);
    var headerRange = dbSheet.getRange(1, 1, 1, dbHeaders.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#1e293b");
    headerRange.setFontColor("#ffffff");
  } else {
    // Auto-migrate: ensure all required columns exist in the existing System_DB sheet
    var existingHeaders = dbSheet.getRange(1, 1, 1, dbSheet.getLastColumn()).getValues()[0];
    var colsToMigrate = [
      "Synced_Form_Department", "Verified_Index_Mark",
      "Admission_Number", "Token_Number", "Joined_Semester", "Leaving_Semester",
      "Promotion_Status", "Dues_Status", "Leaving_Date", "Application_Date",
      "Issue_Date", "Conduct", "PTA_Welfare_Fund", "PTA_Membership",
      "PTA_Donation", "Program_Type", "Assigned_Slot", "Principal_Remarks"
    ];
    colsToMigrate.forEach(function(col) {
      // Re-read headers each iteration so lengths stay accurate after additions
      var currentHeaders = dbSheet.getRange(1, 1, 1, dbSheet.getLastColumn()).getValues()[0];
      if (findHeaderIndex(currentHeaders, col) === -1) {
        dbSheet.getRange(1, currentHeaders.length + 1).setValue(col)
          .setFontWeight("bold")
          .setBackground("#1e293b")
          .setFontColor("#ffffff");
      }
    });
  }
  return dbSheet;
}

// onFormSubmit Trigger: Handled live on dashboard verification, no-op for background sync
function onFormSubmit(e) {
  // Deprecated: We now register students to System_DB only after Department verification
}

// Fetch all student records for a department by joining Master Responses & System_DB
function getDepartmentData(department) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var tz = sheet.getSpreadsheetTimeZone();
    var masterSheet = getMasterSheet(sheet);
    var dbSheet = sheet.getSheetByName(SYSTEM_DB_SHEET_NAME);
    
    if (!dbSheet) {
      return JSON.stringify({ success: false, message: "System_DB not found." });
    }
    
    var masterLastRow = masterSheet.getLastRow();
    if (masterLastRow < 2) {
      return JSON.stringify({ success: true, data: [] });
    }
    
    var masterHeaders = masterSheet.getRange(1, 1, 1, masterSheet.getLastColumn()).getValues()[0];
    var masterValues = masterSheet.getRange(2, 1, masterLastRow - 1, masterSheet.getLastColumn()).getValues();
    
    var capidIndex = findHeaderIndex(masterHeaders, KEY_HEADER);
    var emailIndex = findHeaderIndex(masterHeaders, EMAIL_HEADER);
    var emailFallbackIndex = findHeaderIndex(masterHeaders, EMAIL_FALLBACK_HEADER);
    var deptIndex = findHeaderIndex(masterHeaders, DEPT_HEADER);
    
    if (capidIndex === -1 || deptIndex === -1) {
      return JSON.stringify({ success: false, message: "Master sheet missing CAPID or Department columns." });
    }
    
    // Fetch System_DB state
    var dbLastRow = dbSheet.getLastRow();
    var dbHeaders = dbSheet.getRange(1, 1, 1, dbSheet.getLastColumn()).getValues()[0];
    var dbData = {};
    
    if (dbLastRow > 1) {
      var dbValues = dbSheet.getRange(2, 1, dbLastRow - 1, dbSheet.getLastColumn()).getValues();
      var capidColIndex = findHeaderIndex(dbHeaders, "CAPID");
      if (capidColIndex !== -1) {
        dbValues.forEach(function(row) {
          var cid = row[capidColIndex] ? row[capidColIndex].toString().trim().toLowerCase() : "";
          if (cid) {
            var rowObj = {};
            for (var c = 0; c < dbHeaders.length; c++) {
              rowObj[dbHeaders[c]] = row[c];
            }
            dbData[cid] = rowObj;
          }
        });
      }
    }
    
    // Reconstruct student profiles for the department
    var combinedData = [];
    masterValues.forEach(function(row) {
      var studentDept = row[deptIndex] ? row[deptIndex].toString().trim() : "";
      if (studentDept.toLowerCase() === department.toLowerCase()) {
        var capid = row[capidIndex] ? row[capidIndex].toString().trim() : "";
        var email = "";
        if (emailIndex !== -1 && row[emailIndex]) {
          email = row[emailIndex].toString().trim();
        } else if (emailFallbackIndex !== -1 && row[emailFallbackIndex]) {
          email = row[emailFallbackIndex].toString().trim();
        }
        var studentKey = capid + "|" + email;
        
        var profile = {};
        // 1. Copy raw submission details with trimmed keys
        for (var c = 0; c < masterHeaders.length; c++) {
          var cleanKey = masterHeaders[c] ? masterHeaders[c].toString().trim() : "";
          if (cleanKey) {
            profile[cleanKey] = row[c];
          }
        }
        
        // 2. Mix in system state details from System_DB
        var systemState = dbData[capid.toLowerCase()];
        dbHeaders.forEach(function(h) {
          var cleanH = h ? h.toString().trim() : "";
          if (cleanH && cleanH !== "Student_Key" && cleanH !== "CAPID" && cleanH !== "Email" && cleanH !== "Program") {
            if (cleanH === "Department") {
              profile["System_Department"] = systemState ? systemState[h] : "";
            } else {
              profile[cleanH] = systemState ? systemState[h] : "";
            }
          }
        });
        
        // Ensure Current_Status has a default
        if (!profile["Current_Status"]) {
          profile["Current_Status"] = "Pending_Faculty";
        }
        
        profile["Department"] = studentDept;
        combinedData.push(sanitizeStudentProfile(profile, tz));
      }
    });
    
    return JSON.stringify({ success: true, data: combinedData });
  } catch (error) {
    return JSON.stringify({ success: false, message: error.toString() });
  }
}

// Fetch all student records across all departments (Central Admin views)
function getAllDepartmentsData() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var tz = sheet.getSpreadsheetTimeZone();
    var masterSheet = getMasterSheet(sheet);
    var dbSheet = sheet.getSheetByName(SYSTEM_DB_SHEET_NAME);
    
    if (!dbSheet) {
      return JSON.stringify({ success: false, message: "System_DB not found." });
    }
    
    var masterLastRow = masterSheet.getLastRow();
    if (masterLastRow < 2) {
      return JSON.stringify({ success: true, data: [] });
    }
    
    var masterHeaders = masterSheet.getRange(1, 1, 1, masterSheet.getLastColumn()).getValues()[0];
    var masterValues = masterSheet.getRange(2, 1, masterLastRow - 1, masterSheet.getLastColumn()).getValues();
    
    var capidIndex = findHeaderIndex(masterHeaders, KEY_HEADER);
    var emailIndex = findHeaderIndex(masterHeaders, EMAIL_HEADER);
    var emailFallbackIndex = findHeaderIndex(masterHeaders, EMAIL_FALLBACK_HEADER);
    var deptIndex = findHeaderIndex(masterHeaders, DEPT_HEADER);
    
    if (capidIndex === -1 || deptIndex === -1) {
      return JSON.stringify({ success: false, message: "Master sheet missing CAPID or Department columns." });
    }
    
    var dbLastRow = dbSheet.getLastRow();
    var dbHeaders = dbSheet.getRange(1, 1, 1, dbSheet.getLastColumn()).getValues()[0];
    var dbData = {};
    
    if (dbLastRow > 1) {
      var dbValues = dbSheet.getRange(2, 1, dbLastRow - 1, dbSheet.getLastColumn()).getValues();
      var capidColIndex = findHeaderIndex(dbHeaders, "CAPID");
      if (capidColIndex !== -1) {
        dbValues.forEach(function(row) {
          var cid = row[capidColIndex] ? row[capidColIndex].toString().trim().toLowerCase() : "";
          if (cid) {
            var rowObj = {};
            for (var c = 0; c < dbHeaders.length; c++) {
              rowObj[dbHeaders[c]] = row[c];
            }
            dbData[cid] = rowObj;
          }
        });
      }
    }
    
    var combinedData = [];
    masterValues.forEach(function(row) {
      var capid = row[capidIndex] ? row[capidIndex].toString().trim() : "";
      var email = "";
      if (emailIndex !== -1 && row[emailIndex]) {
        email = row[emailIndex].toString().trim();
      } else if (emailFallbackIndex !== -1 && row[emailFallbackIndex]) {
        email = row[emailFallbackIndex].toString().trim();
      }
      var studentKey = capid + "|" + email;
      var studentDept = row[deptIndex] ? row[deptIndex].toString().trim() : "";
      
      var profile = {};
      // 1. Copy raw submission details with trimmed keys
      for (var c = 0; c < masterHeaders.length; c++) {
        var cleanKey = masterHeaders[c] ? masterHeaders[c].toString().trim() : "";
        if (cleanKey) {
          profile[cleanKey] = row[c];
        }
      }
      
      var systemState = dbData[capid.toLowerCase()];
      dbHeaders.forEach(function(h) {
        var cleanH = h ? h.toString().trim() : "";
        if (cleanH && cleanH !== "Student_Key" && cleanH !== "CAPID" && cleanH !== "Email" && cleanH !== "Program") {
          if (cleanH === "Department") {
            profile["System_Department"] = systemState ? systemState[h] : "";
          } else {
            profile[cleanH] = systemState ? systemState[h] : "";
          }
        }
      });
      
      if (!profile["Current_Status"]) {
        profile["Current_Status"] = "Pending_Faculty";
      }
      profile["Department"] = studentDept;
      combinedData.push(sanitizeStudentProfile(profile, tz));
    });
    
    return JSON.stringify({ success: true, data: combinedData });
  } catch (error) {
    return JSON.stringify({ success: false, message: error.toString() });
  }
}

// Helper to list all available departments
function getDepartmentsList() {
  try {
    var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
    var depts = [];
    for (var i = 0; i < sheets.length; i++) {
      var name = sheets[i].getName();
      // Filter out system sheets and manual department sheets
      if (!isSystemSheet(name)) {
        depts.push(name);
      }
    }
    
    if (depts.length === 0) {
      depts = [
        "Botany", "Chemistry", "Commerce", "Computer Science", "English",
        "Economics", "Hindi", "History", "Malayalam", "Mathematics",
        "Physics", "Psychology", "Sanskrit", "Statistics", "Tamil", "Zoology"
      ];
    }
    return JSON.stringify({ success: true, departments: depts });
  } catch (error) {
    return JSON.stringify({ success: false, message: error.toString() });
  }
}

// Update student workflow attributes inside System_DB only
function updateStudentData(department, capid, email, updatedData, operatorRole, operatorDept) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (e) {
    return JSON.stringify({ success: false, message: "System is busy. Please try again." });
  }
  
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var dbSheet = getOrCreateSystemDBSheet(sheet);
    var lastRow = dbSheet.getLastRow();
    
    if (lastRow < 2) {
      return JSON.stringify({ success: false, message: "System database is empty." });
    }
    
    var dbHeaders = dbSheet.getRange(1, 1, 1, dbSheet.getLastColumn()).getValues()[0];
    var capidIndex = findHeaderIndex(dbHeaders, "CAPID");
    var capidValues = (capidIndex !== -1 && lastRow > 1) ? dbSheet.getRange(2, capidIndex + 1, lastRow - 1, 1).getValues() : [];
    
    var studentKey = capid + "|" + email;
    var targetRowIndex = -1;
    var capidLower = capid.toString().trim().toLowerCase();
    for (var i = 0; i < capidValues.length; i++) {
      if (capidValues[i][0] && capidValues[i][0].toString().trim().toLowerCase() === capidLower) {
        targetRowIndex = i + 2;
        break;
      }
    }
    
    // Lookup student details in Master Responses for default index, program, and audit log name
    var studentName = "Student";
    var programName = "";
    var formIndexMark = "";
    var programType = "";
    try {
      var masterSheet = getMasterSheet(sheet);
      var masterHeaders = masterSheet.getRange(1, 1, 1, masterSheet.getLastColumn()).getValues()[0];
      var masterLastRow = masterSheet.getLastRow();
      if (masterLastRow > 1) {
        var masterValues = masterSheet.getRange(2, 1, masterLastRow - 1, masterSheet.getLastColumn()).getValues();
        var capidIdx = findHeaderIndex(masterHeaders, KEY_HEADER);
        var progIdx = findHeaderIndex(masterHeaders, PROG_HEADER);
        var indexMarkIdx = findHeaderIndex(masterHeaders, "Index Marks (as per admit/allotment card)");
        var nameIdx = findHeaderIndex(masterHeaders, "Name (As per your certificate)");
        if (nameIdx === -1) nameIdx = findHeaderIndex(masterHeaders, "Name");
        
        for (var idx = 0; idx < masterValues.length; idx++) {
          var cId = (capidIdx !== -1 && masterValues[idx][capidIdx]) ? masterValues[idx][capidIdx].toString().trim().toLowerCase() : "";
          if (cId === capidLower) {
            studentName = (nameIdx !== -1 ? masterValues[idx][nameIdx] : "") || "Student";
            programName = (progIdx !== -1 ? masterValues[idx][progIdx] : "") || "";
            formIndexMark = (indexMarkIdx !== -1 ? masterValues[idx][indexMarkIdx] : "") || "";
            
            // Deduce program type (e.g. B.Sc., BA, MA, etc.)
            if (programName) {
              var clean = programName.replace(/\./g, "").trim().toUpperCase();
              if (clean.indexOf("BSC") > -1) programType = "B.Sc.";
              else if (clean.indexOf("BCOM") > -1) programType = "B.Com.";
              else if (clean.indexOf("BA") > -1) programType = "BA";
              else if (clean.indexOf("MSC") > -1) programType = "M.Sc.";
              else if (clean.indexOf("MCOM") > -1) programType = "M.Com.";
              else if (clean.indexOf("MA") > -1) programType = "MA";
              else if (clean.indexOf("PHD") > -1) programType = "Ph.D.";
              else programType = programName;
            }
            break;
          }
        }
      }
    } catch (e) {
      Logger.log("Failed to load details from Master Responses: " + e.toString());
    }
    
    if (targetRowIndex === -1) {
      // Auto-insert student row if somehow missing in System_DB
      var newRow = [];
      dbHeaders.forEach(function(header) {
        if (header === "Student_Key") newRow.push(studentKey);
        else if (header === "CAPID") newRow.push(capid);
        else if (header === "Email") newRow.push(email);
        else if (header === "Department") newRow.push(department);
        else if (header === "Program") newRow.push(programName);
        else if (header === "Current_Status") newRow.push("Pending_Faculty");
        else if (header === "Synced_Form_Department") newRow.push(department);
        else if (header === "Verified_Index_Mark") newRow.push(formIndexMark);
        else if (header === "Program_Type") newRow.push(programType);
        else newRow.push("");
      });
      dbSheet.appendRow(newRow);
      targetRowIndex = dbSheet.getLastRow();
    }
    
    // Check if we need to generate a verification Token number (Faculty verify)
    var currentStatusIndex = findHeaderIndex(dbHeaders, "Current_Status");
    var tokenIndex = findHeaderIndex(dbHeaders, "Token_Number");
    var existingRow = dbSheet.getRange(targetRowIndex, 1, 1, dbHeaders.length).getValues()[0];
    
    var prevStatus = currentStatusIndex !== -1 ? existingRow[currentStatusIndex] : "";
    var existingToken = tokenIndex !== -1 ? existingRow[tokenIndex] : "";
    var nextStatus = updatedData["Current_Status"] || prevStatus;
    var tokenGenerated = existingToken;
    
    if (nextStatus === "Pending_Nodal" && !existingToken && tokenIndex !== -1) {
      var prefix = "T";
      
      // Compute sequential token number centrally (across all departments in System_DB)
      var allTokens = dbSheet.getRange(2, tokenIndex + 1, lastRow - 1, 1).getValues().map(function(r) {
        return r[0] ? r[0].toString().trim() : "";
      });
      
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
      var paddedNum = nextNum.toString();
      while (paddedNum.length < 3) {
        paddedNum = "0" + paddedNum;
      }
      tokenGenerated = prefix + "-" + paddedNum;
      updatedData["Token_Number"] = tokenGenerated;
    }
    
    // Write changes strictly to System_DB row
    var rowRange = dbSheet.getRange(targetRowIndex, 1, 1, dbHeaders.length);
    var rowValues = rowRange.getValues()[0];
    
    var changes = [];
    for (var col = 0; col < dbHeaders.length; col++) {
      var headerName = dbHeaders[col];
      if (updatedData.hasOwnProperty(headerName)) {
        var oldVal = rowValues[col];
        var newVal = updatedData[headerName];
        if (oldVal !== newVal) {
          rowValues[col] = newVal;
          changes.push(headerName + ": '" + oldVal + "' -> '" + newVal + "'");
        }
      }
    }
    
    // Complete department transfer at the Principal approval level
    if (nextStatus === "TC Issued") {
      var deptColIdx = findHeaderIndex(dbHeaders, "Department");
      if (deptColIdx !== -1) {
        var oldDept = rowValues[deptColIdx];
        if (oldDept !== department) {
          rowValues[deptColIdx] = department; // Promotes to the new department
          changes.push("Department: '" + oldDept + "' -> '" + department + "'");
        }
      }
      var syncedDeptColIdx = findHeaderIndex(dbHeaders, "Synced_Form_Department");
      if (syncedDeptColIdx !== -1) {
        rowValues[syncedDeptColIdx] = department; // Align synced form department
      }
    }
    
    rowRange.setValues([rowValues]);
    
    // Write audit log entry
    var changesStr = changes.join(", ");
    logActivity(capid, email, studentName, department, prevStatus, nextStatus, operatorRole, operatorDept, changesStr);
    
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

// Log admin/faculty actions to an Audit_Logs sheet
function logActivity(capid, email, studentName, department, prevStatus, nextStatus, operatorRole, operatorDept, changesStr) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = sheet.getSheetByName("Audit_Logs");
    
    if (!logSheet) {
      logSheet = sheet.insertSheet("Audit_Logs");
      var headers = ["Timestamp", "Email", "CAPID", "Student Name", "Department", "Operator Role", "Operator Department", "Previous Status", "New Status", "Changes / Remarks"];
      logSheet.appendRow(headers);
      
      // Style headers
      var headerRange = logSheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f1f3f4");
    }
    
    var row = [
      new Date(),
      email || "",
      capid || "",
      studentName || "",
      department || "",
      operatorRole || "System",
      operatorDept || "System",
      prevStatus || "",
      nextStatus || "",
      changesStr || ""
    ];
    
    logSheet.appendRow(row);
  } catch (err) {
    Logger.log("Error in logActivity: " + err.toString());
  }
}

// Credentials Validation using a 'Credentials' sheet
function validateCredentials(role, department, password) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var credSheet = sheet.getSheetByName(CREDENTIALS_SHEET_NAME);
    var needInit = false;
    
    if (!credSheet) {
      credSheet = sheet.insertSheet(CREDENTIALS_SHEET_NAME);
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
      
      var headerRange = credSheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f1f3f4");
    } else {
      // Smart Sync credentials sheet
      var lastRow = credSheet.getLastRow();
      var existingRows = credSheet.getRange(2, 1, lastRow - 1, 3).getValues();
      var existingKeys = {};
      
      existingRows.forEach(function(row) {
        var r = row[0] ? row[0].toString().trim() : "";
        var d = row[1] ? row[1].toString().trim() : "";
        existingKeys[r + "|" + d] = true;
      });
      
      var missingRows = [];
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
      
      departmentsList.forEach(function(d) {
        var keyFac = "Faculty|" + d;
        var cleanCode = getDeptCode(d).toLowerCase();
        if (!existingKeys[keyFac]) {
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
    var data = credSheet.getRange(2, 1, lastRow - 1, 3).getValues();
    var validated = false;
    
    for (var i = 0; i < data.length; i++) {
      var dbRole = data[i][0] ? data[i][0].toString().trim() : "";
      var dbDept = data[i][1] ? data[i][1].toString().trim() : "";
      var dbPass = data[i][2] ? data[i][2].toString().trim() : "";
      
      if (dbRole === role && dbPass === password) {
        if (role === "Faculty" || role === "HOD") {
          if (dbDept === department) {
            validated = true;
            break;
          }
        } else {
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

// Fetch PTA Config table from sheet
function getPTAConfig() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var configSheet = sheet.getSheetByName(PTA_CONFIG_SHEET_NAME);
    var needInit = false;
    
    if (!configSheet) {
      configSheet = sheet.insertSheet(PTA_CONFIG_SHEET_NAME);
      needInit = true;
    } else if (configSheet.getLastRow() < 2) {
      needInit = true;
    }
    
    if (needInit) {
      configSheet.clear();
      var headers = ["Program_Type", "Welfare_SCST", "Membership_SCST", "Donation_SCST", "Welfare_NonSCST", "Membership_NonSCST", "Donation_NonSCST"];
      configSheet.appendRow(headers);
      
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
    var configSheet = sheet.getSheetByName(PTA_CONFIG_SHEET_NAME);
    
    if (!configSheet) {
      configSheet = sheet.insertSheet(PTA_CONFIG_SHEET_NAME);
    }
    
    configSheet.clear();
    var headers = ["Program_Type", "Welfare_SCST", "Membership_SCST", "Donation_SCST", "Welfare_NonSCST", "Membership_NonSCST", "Donation_NonSCST"];
    configSheet.appendRow(headers);
    
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

// Helper to retrieve seat matrix data for a specific sheet (PG or UG) - strictly READ-ONLY
function retrieveMatrixData(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var matrixSheet = sheet.getSheetByName(sheetName);
  if (!matrixSheet) return [];
  
  var lastRow = matrixSheet.getLastRow();
  if (lastRow < 1) return [];
  
  var values = matrixSheet.getRange(1, 1, lastRow, Math.max(1, matrixSheet.getLastColumn())).getValues();
  
  // Find which row contains headers dynamically
  var headerRowIdx = -1;
  for (var r = 0; r < Math.min(values.length, 5); r++) {
    var hasOpen = false;
    for (var c = 0; c < values[r].length; c++) {
      var valClean = values[r][c] ? values[r][c].toString().trim().toUpperCase() : "";
      if (valClean === "OPEN") {
        hasOpen = true;
        break;
      }
    }
    if (hasOpen) {
      headerRowIdx = r;
      break;
    }
  }
  
  if (headerRowIdx === -1) return [];
  
  var sheetHeaders = values[headerRowIdx];
  var data = [];
  for (var r = headerRowIdx + 1; r < values.length; r++) {
    var deptName = values[r][0] ? values[r][0].toString().trim() : "";
    if (deptName.toLowerCase() === "total" || !deptName) {
      continue;
    }
    if (sheetName === "SeatSplitUp_UG" && deptName.toLowerCase() === "statistics") {
      continue;
    }
    var rowObj = {};
    for (var c = 0; c < sheetHeaders.length; c++) {
      var headerName = sheetHeaders[c] ? sheetHeaders[c].toString().trim() : "";
      if (c === 0) {
        headerName = "Department";
      }
      if (headerName) {
        rowObj[headerName] = values[r][c];
      }
    }
    data.push(rowObj);
  }
  return data;
}

// Fetch Seat Matrix configurations for PG and UG
function getSeatMatrix() {
  try {
    var pgData = retrieveMatrixData("SeatSplitUp"); // Default PG
    var ugData = retrieveMatrixData("SeatSplitUp_UG"); // UG
    return JSON.stringify({ success: true, pgData: pgData, ugData: ugData });
  } catch (error) {
    return JSON.stringify({ success: false, message: error.toString() });
  }
}

// Update Seat Matrix / SeatSplitUp configurations (PG or UG) - strictly READ-ONLY
function updateSeatMatrix(matrixData, type) {
  return JSON.stringify({ success: false, message: "Write access is disabled. Please edit the Google Sheet directly." });
}

// Send stylized PTA receipt email to student
function emailPTAReceipt(capid, email) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var masterSheet = getMasterSheet(sheet);
    var dbSheet = sheet.getSheetByName(SYSTEM_DB_SHEET_NAME);
    
    if (!dbSheet) {
      return JSON.stringify({ success: false, message: "System database not found." });
    }
    
    var masterHeaders = masterSheet.getRange(1, 1, 1, masterSheet.getLastColumn()).getValues()[0];
    var masterLastRow = masterSheet.getLastRow();
    var masterValues = masterSheet.getRange(2, 1, masterLastRow - 1, masterSheet.getLastColumn()).getValues();
    
    var capidIndex = findHeaderIndex(masterHeaders, KEY_HEADER);
    var emailIndex = findHeaderIndex(masterHeaders, EMAIL_HEADER);
    var emailFallbackIndex = findHeaderIndex(masterHeaders, EMAIL_FALLBACK_HEADER);
    var nameIndex = findHeaderIndex(masterHeaders, "Name (As per your certificate)");
    var deptIndex = findHeaderIndex(masterHeaders, DEPT_HEADER);
    
    var studentRow = null;
    var studentEmail = email;
    for (var i = 0; i < masterValues.length; i++) {
      var cId = (capidIndex !== -1 && masterValues[i][capidIndex]) ? masterValues[i][capidIndex].toString().trim() : "";
      var eId = "";
      if (emailIndex !== -1 && masterValues[i][emailIndex]) {
        eId = masterValues[i][emailIndex].toString().trim();
      } else if (emailFallbackIndex !== -1 && masterValues[i][emailFallbackIndex]) {
        eId = masterValues[i][emailFallbackIndex].toString().trim();
      }
      
      if (cId === capid && eId === email) {
        studentRow = masterValues[i];
        if (!studentEmail) studentEmail = eId;
        break;
      }
    }
    
    if (!studentRow) {
      return JSON.stringify({ success: false, message: "Student record not found." });
    }
    
    var studentName = (nameIndex !== -1 ? studentRow[nameIndex] : "") || "Student";
    var studentDept = (deptIndex !== -1 ? studentRow[deptIndex] : "") || "College Department";
    
    // Get state details from System_DB
    var dbHeaders = dbSheet.getRange(1, 1, 1, dbSheet.getLastColumn()).getValues()[0];
    var dbLastRow = dbSheet.getLastRow();
    var dbValues = dbSheet.getRange(2, 1, dbLastRow - 1, dbSheet.getLastColumn()).getValues();
    
    var keyCol = findHeaderIndex(dbHeaders, "Student_Key");
    var studentKey = capid + "|" + email;
    var dbRow = null;
    if (keyCol !== -1) {
      for (var i = 0; i < dbValues.length; i++) {
        if (dbValues[i][keyCol].toString().trim() === studentKey) {
          dbRow = dbValues[i];
          break;
        }
      }
    }
    
    if (!dbRow) {
      return JSON.stringify({ success: false, message: "PTA payment details not initialized." });
    }
    
    var welfare = dbRow[findHeaderIndex(dbHeaders, "PTA_Welfare_Fund")] || "0";
    var membership = dbRow[findHeaderIndex(dbHeaders, "PTA_Membership")] || "0";
    var donation = dbRow[findHeaderIndex(dbHeaders, "PTA_Donation")] || "0";
    var total = dbRow[findHeaderIndex(dbHeaders, "PTA_Amount")] || "0";
    var token = dbRow[findHeaderIndex(dbHeaders, "Token_Number")] || "N/A";
    var progType = dbRow[findHeaderIndex(dbHeaders, "Program_Type")] || "N/A";
    
    if (!studentEmail) {
      return JSON.stringify({ success: false, message: "Student email address is unavailable." });
    }
    
    // Build the logo as an inline attachment blob (Gmail blocks base64 data URIs in email)
    var inlineImages = {};
    var logoHtml = "";
    try {
      var logoBase64 = getLogoBase64(); // "data:image/png;base64,<data>"
      var base64Data = logoBase64.replace(/^data:image\/\w+;base64,/, "");
      var decoded = Utilities.base64Decode(base64Data);
      var logoBlobRaw = Utilities.newBlob(decoded, "image/png", "logo.png");
      inlineImages["college_logo"] = logoBlobRaw;
      logoHtml = "<img src='cid:college_logo' style='max-height: 70px; margin-bottom: 10px;' alt='College Logo'/>";
    } catch (logoErr) {
      // Logo failed silently – email still sends without it
      logoHtml = "";
    }

    // Generate beautiful responsive HTML body
    var htmlBody = 
      "<div style='font-family: \"Segoe UI\", Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; color: #1a202c; box-shadow: 0 4px 6px rgba(0,0,0,0.05);'>" +
        "<div style='text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px;'>" +
          logoHtml +
          "<h2 style='margin: 0; color: #1e3a8a; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;'>GOVT. VICTORIA COLLEGE, PALAKKAD</h2>" +
          "<h3 style='margin: 5px 0 0 0; color: #059669; font-size: 14px; font-weight: 600;'>PARENT TEACHER ASSOCIATION (PTA) RECEIPT</h3>" +
        "</div>" +
        "<div style='margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #edf2f7; font-size: 13px; line-height: 1.6;'>" +
          "<div><strong>Receipt / Token No:</strong> " + token + "</div>" +
          "<div><strong>CAP ID:</strong> " + capid + "</div>" +
          "<div><strong>Student Name:</strong> " + studentName.toString().toUpperCase() + "</div>" +
          "<div><strong>Department / Program:</strong> " + studentDept + " (" + progType + ")</div>" +
          "<div><strong>Email Address:</strong> " + studentEmail + "</div>" +
        "</div>" +
        "<table style='width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 25px;'>" +
          "<thead>" +
            "<tr style='border-bottom: 2px solid #e2e8f0; color: #718096; font-weight: 700; text-align: left;'>" +
              "<th style='padding: 8px 0;'>Fee Component</th>" +
              "<th style='padding: 8px 0; text-align: right;'>Amount</th>" +
            "</tr>" +
          "</thead>" +
          "<tbody>" +
            "<tr style='border-bottom: 1px solid #edf2f7;'>" +
              "<td style='padding: 10px 0;'>1. Welfare Fund (Mandatory)</td>" +
              "<td style='padding: 10px 0; text-align: right;'>INR " + welfare + "/-</td>" +
            "</tr>" +
            "<tr style='border-bottom: 1px solid #edf2f7;'>" +
              "<td style='padding: 10px 0;'>2. Membership Fee (Mandatory)</td>" +
              "<td style='padding: 10px 0; text-align: right;'>INR " + membership + "/-</td>" +
            "</tr>" +
            "<tr style='border-bottom: 1px solid #edf2f7;'>" +
              "<td style='padding: 10px 0;'>3. Donation / Other (Optional)</td>" +
              "<td style='padding: 10px 0; text-align: right;'>INR " + donation + "/-</td>" +
            "</tr>" +
            "<tr style='font-weight: bold; font-size: 15px; color: #059669;'>" +
              "<td style='padding: 15px 0 0 0;'>TOTAL AMOUNT PAID:</td>" +
              "<td style='padding: 15px 0 0 0; text-align: right;'>INR " + total + "/-</td>" +
            "</tr>" +
          "</tbody>" +
        "</table>" +
        "<div style='border-top: 1px dashed #e2e8f0; padding-top: 20px; text-align: center; color: #718096; font-size: 11px;'>" +
          "<p style='margin: 0;'>Thank you for your contribution to GVC PTA.</p>" +
          "<p style='margin: 5px 0 0 0;'>* This is an automated receipt copy generated by the GVC Admission ERP System.</p>" +
        "</div>" +
      "</div>";
    
    MailApp.sendEmail({
      to: studentEmail,
      subject: "PTA Fund Collection Receipt - " + studentName.toString().toUpperCase() + " (Token: " + token + ")",
      htmlBody: htmlBody,
      inlineImages: inlineImages
    });
    
    return JSON.stringify({ success: true, message: "Receipt email sent successfully!" });
  } catch (error) {
    return JSON.stringify({ success: false, message: "Failed to send email: " + error.toString() });
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
      result = JSON.parse(updateStudentData(requestData.department, requestData.capid, requestData.email, requestData.updatedData, requestData.operatorRole, requestData.operatorDept));
    } else if (action === "getPTAConfig") {
      result = JSON.parse(getPTAConfig());
    } else if (action === "updatePTAConfig") {
      result = JSON.parse(updatePTAConfig(requestData.configData));
    } else if (action === "getAllDepartmentsData") {
      result = JSON.parse(getAllDepartmentsData());
    } else if (action === "getSeatMatrix") {
      result = JSON.parse(getSeatMatrix());
    } else if (action === "updateSeatMatrix") {
      result = JSON.parse(updateSeatMatrix(requestData.matrixData, requestData.type));
    } else if (action === "emailPTAReceipt") {
      result = JSON.parse(emailPTAReceipt(requestData.capid, requestData.email));
    } else if (action === "getDriveImageAsBase64") {
      result = { success: true, data: getDriveImageAsBase64(requestData.fileId) };
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

// Fetch a Google Drive image and return it as a Base64 string (handles private folders & sandbox cookie blocks)
function getDriveImageAsBase64(fileId) {
  try {
    if (!fileId) return "";
    var file = DriveApp.getFileById(fileId);
    var blob = file.getBlob();
    var bytes = blob.getBytes();
    var base64 = Utilities.base64Encode(bytes);
    return "data:" + blob.getContentType() + ";base64," + base64;
  } catch (e) {
    Logger.log("Error fetching image " + fileId + ": " + e.toString());
    return "";
  }
}

// Timezone-safe Date sanitization helper to prevent 1-day backward shifts
function sanitizeStudentProfile(profile, tz) {
  for (var key in profile) {
    if (profile.hasOwnProperty(key)) {
      var val = profile[key];
      if (val instanceof Date) {
        profile[key] = Utilities.formatDate(val, tz, "yyyy-MM-dd");
      }
    }
  }
  return profile;
}

// Cleans up any existing duplicate records in System_DB, keeping only the first one
function deduplicateSystemDB(dbSheet) {
  var lastRow = dbSheet.getLastRow();
  if (lastRow < 2) return;
  
  var dbHeaders = dbSheet.getRange(1, 1, 1, dbSheet.getLastColumn()).getValues()[0];
  var capidCol = findHeaderIndex(dbHeaders, "CAPID");
  if (capidCol === -1) return;
  
  var capids = dbSheet.getRange(2, capidCol + 1, lastRow - 1, 1).getValues();
  var seenCapids = {};
  var rowsToDelete = [];
  
  for (var i = 0; i < capids.length; i++) {
    var cid = capids[i][0] ? capids[i][0].toString().trim().toLowerCase() : "";
    if (cid) {
      if (seenCapids[cid]) {
        rowsToDelete.push(i + 2); // 2-indexed row number
      } else {
        seenCapids[cid] = true;
      }
    }
  }
  
  if (rowsToDelete.length > 0) {
    Logger.log("Deleting " + rowsToDelete.length + " duplicate rows from System_DB");
    for (var d = rowsToDelete.length - 1; d >= 0; d--) {
      dbSheet.deleteRow(rowsToDelete[d]);
    }
  }
}
