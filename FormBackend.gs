var MASTER_DATA_SHEET_NAME = 'MasterData';

function getStudentData(capId, email) {
  if (email) {
    var sub = getUserSubmission(email);
    if (sub.found) {
      return { success: true, isReturning: true, submissionData: sub.data, isEditable: sub.isEditable };
    }
  }

  if (!capId) return { success: false, error: 'CAP ID is required' };
  
  var cache = CacheService.getScriptCache();
  var cacheKey = 'student_' + capId;
  var cached = cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MASTER_DATA_SHEET_NAME);
  if (!sheet) return { success: false, error: 'MasterData sheet not found' };
  
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: false, error: 'MasterData is empty' };
  
  var headers = data[0];
  var capIdIdx = headers.indexOf('CapID');
  var nameIdx = headers.indexOf('Name');
  var levelIdx = headers.indexOf('Level');
  var deptIdx = headers.indexOf('Dept');
  var catIdx = headers.indexOf('Cat');
  var indexMarkIdx = headers.indexOf('Index Mark');
  
  if (capIdIdx === -1) return { success: false, error: 'CapID column not found in MasterData' };
  
  for (var i = 1; i < data.length; i++) {
    var cellCapId = data[i][capIdIdx] ? data[i][capIdIdx].toString().trim().toUpperCase() : '';
    if (cellCapId === capId) {
      var result = {
        success: true,
        data: {
          name: nameIdx !== -1 ? data[i][nameIdx] : '',
          programme: levelIdx !== -1 ? data[i][levelIdx] : '',
          department: deptIdx !== -1 ? data[i][deptIdx] : '',
          category: catIdx !== -1 ? data[i][catIdx] : '',
          indexMark: indexMarkIdx !== -1 ? data[i][indexMarkIdx] : ''
        }
      };
      cache.put(cacheKey, JSON.stringify(result), 1800);
      return result;
    }
  }
  return { success: false, error: 'CAP ID not found in MasterData' };
}

function getUserSubmission(email) {
    if (!email) return { found: false };
    
    var cache = CacheService.getScriptCache();
    var cacheKey = 'submission_' + email;
    var cached = cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    var sheet = getMasterSheet(SpreadsheetApp.getActiveSpreadsheet());
    if (!sheet) return { found: false, error: 'Responses sheet not found' };
    
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return { found: false };
    
    var headers = data[0];
    var emailColIdx = headers.indexOf('Email address'); 
    if (emailColIdx === -1) emailColIdx = headers.indexOf('Email id');
    if (emailColIdx === -1) return { found: false, error: 'Email column not found' };
    
    var isEditable = false;
    var dbSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("System_DB");
    if (dbSheet) {
       var dbData = dbSheet.getDataRange().getValues();
       if (dbData.length > 1) {
          var dbHeaders = dbData[0];
          var dbEmailIdx = dbHeaders.indexOf('Email');
          var dbAllowEditIdx = dbHeaders.indexOf('Allow_Edit');
          if (dbEmailIdx !== -1 && dbAllowEditIdx !== -1) {
             for (var k = 1; k < dbData.length; k++) {
                if (dbData[k][dbEmailIdx] && dbData[k][dbEmailIdx].toString().toLowerCase() === email.toLowerCase()) {
                   var permVal = dbData[k][dbAllowEditIdx];
                   if (permVal === true || String(permVal).toUpperCase() === 'TRUE') {
                      isEditable = true;
                   }
                   break;
                }
             }
          }
       }
    }
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][emailColIdx] && data[i][emailColIdx].toString().toLowerCase() === email.toLowerCase()) {
        var rowObj = {};
        for (var j = 0; j < headers.length; j++) {
          rowObj[headers[j]] = data[i][j];
        }
        
        var result = {
          found: true,
          isEditable: isEditable,
          data: rowObj
        };
        cache.put(cacheKey, JSON.stringify(result), 1800);
        return result;
      }
    }
    return { found: false };
}

function processFormSubmission(formData) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    return { success: false, error: 'System is busy. Please try again in a few moments.' };
  }
  
  try {
    if (parseInt(formData.captchaAnswer) !== parseInt(formData.captchaExpected)) {
      return { success: false, error: 'Incorrect Captcha. Please try again.' };
    }
    
    var email = formData.email || Session.getActiveUser().getEmail();
    if (!email) return { success: false, error: 'Email address is required.' };
    
    var sheet = getMasterSheet(SpreadsheetApp.getActiveSpreadsheet());
    if (!sheet) return { success: false, error: 'Responses sheet not found.' };
    
    if (sheet.getLastColumn() === 0) {
      var baseHeaders = ["Timestamp", "Email address", "Mobile No", "CAP id (Enter the full cap id without any spaces)", "Name (As per your certificate)", "Admission to the Programme", "Admission to the Department", "Admitted Category (As per your admit/allotment card)", "Index Marks (as per admit/allotment card)", "Upload passport size photo"];
      var otherKeys = Object.keys(formData).filter(function(k) { 
        return baseHeaders.indexOf(k) === -1 && k !== 'captchaAnswer' && k !== 'captchaExpected' && k !== 'existingPhotoUrl' && k.indexOf('photo') === -1; 
      });
      var defaultHeaders = baseHeaders.concat(otherKeys);
      sheet.getRange(1, 1, 1, defaultHeaders.length).setValues([defaultHeaders]);
    }
    
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var emailColIdx = headers.indexOf('Email address');
    if (emailColIdx === -1) emailColIdx = headers.indexOf('Email id');
    if (emailColIdx === -1) return { success: false, error: 'Email address column not found.' };
    
    var photoUrl = formData.existingPhotoUrl || "";
    if (formData.photoData && formData.photoMimeType && formData.photoFileName) {
      var FOLDER_ID = '1zz2Ofnc7FXG1xYAd_qIT5RNTVxcGwRi5MULZtx421fXby7YjiYkfUyPtSGXiluvuFIahQtjm'; 
      var blob = Utilities.newBlob(Utilities.base64Decode(formData.photoData), formData.photoMimeType, formData.photoFileName);
      var file;
      try {
        if (FOLDER_ID === 'YOUR_DRIVE_FOLDER_ID') throw new Error("No folder config");
        var folder = DriveApp.getFolderById(FOLDER_ID);
        file = folder.createFile(blob);
      } catch (err) {
        return { success: false, error: 'Photo upload failed. Administrator must check Google Drive folder permissions. ' + err.toString() };
      }
      photoUrl = file.getUrl();
    }
    
    var data = sheet.getDataRange().getValues();
    var rowIndexToUpdate = -1;
    
    var dbSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("System_DB");
    var isEditable = false;
    var dbRowToUpdate = -1;
    var dbAllowEditIdx = -1;
    if (dbSheet) {
       var dbData = dbSheet.getDataRange().getValues();
       if (dbData.length > 1) {
          var dbHeaders = dbData[0];
          var dbEmailIdx = dbHeaders.indexOf('Email');
          dbAllowEditIdx = dbHeaders.indexOf('Allow_Edit');
          var dbMobIdx = dbHeaders.indexOf('Mobile_Number');
          if (dbMobIdx === -1) dbMobIdx = dbHeaders.indexOf('Parent_Mobile');
          var dbDeptIdx = dbHeaders.indexOf('Department');
          
          if (dbEmailIdx !== -1 && dbAllowEditIdx !== -1) {
             for (var k = 1; k < dbData.length; k++) {
                if (dbData[k][dbEmailIdx] && dbData[k][dbEmailIdx].toString().toLowerCase() === email.toLowerCase()) {
                   dbRowToUpdate = k + 1;
                   var permVal = dbData[k][dbAllowEditIdx];
                   if (permVal === true || String(permVal).toUpperCase() === 'TRUE') {
                      isEditable = true;
                   }
                   break;
                }
             }
          }
       }
    }
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][emailColIdx] && data[i][emailColIdx].toString().toLowerCase() === email.toLowerCase()) {
        rowIndexToUpdate = i + 1; 
        if (!isEditable) {
           return { success: false, error: 'You do not have permission to edit this submission.' };
        }
        break;
      }
    }
    
    var existingRow = rowIndexToUpdate > -1 ? sheet.getRange(rowIndexToUpdate, 1, 1, headers.length).getValues()[0] : null;

    var rowData = [];
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i];
      if (h === 'Timestamp') {
        rowData.push(new Date());
      } else if (h === 'Email address' || h === 'Email id') { 
        rowData.push(email);
      } else if (h === 'Upload passport size photo') {
        rowData.push(photoUrl);
      } else {
        if (formData[h] !== undefined) {
          rowData.push(formData[h]);
        } else {
          rowData.push(existingRow ? existingRow[i] : "");
        }
      }
    }
    
    if (rowIndexToUpdate > -1) {
      sheet.getRange(rowIndexToUpdate, 1, 1, rowData.length).setValues([rowData]);
      if (dbRowToUpdate > -1 && dbAllowEditIdx !== -1) {
         dbSheet.getRange(dbRowToUpdate, dbAllowEditIdx + 1).setValue(false);
         // Also update Mobile_Number and Department in System_DB so the backend can link them
         if (typeof dbMobIdx !== 'undefined' && dbMobIdx !== -1 && formData['Mobile No']) {
             dbSheet.getRange(dbRowToUpdate, dbMobIdx + 1).setValue(formData['Mobile No'].toString().trim());
         }
         if (typeof dbDeptIdx !== 'undefined' && dbDeptIdx !== -1 && formData['Admission to the Department']) {
             dbSheet.getRange(dbRowToUpdate, dbDeptIdx + 1).setValue(formData['Admission to the Department'].toString().trim());
         }
      }
      var cache = CacheService.getScriptCache();
      cache.remove('submission_' + email);
      return { success: true, message: 'Submission updated successfully!' };
    } else {
      sheet.appendRow(rowData);
      return { success: true, message: 'Submission created successfully!' };
    }
    
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

function unlockStudentAdmissionForm(email) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    return JSON.stringify({ success: false, error: 'System is busy. Please try again.' });
  }
  try {
    var dbSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("System_DB");
    if (!dbSheet) return JSON.stringify({ success: false, error: 'System_DB sheet not found.' });
    
    var dbData = dbSheet.getDataRange().getValues();
    if (dbData.length < 2) return JSON.stringify({ success: false, error: 'System_DB is empty.' });
    
    var dbHeaders = dbData[0];
    var dbEmailIdx = dbHeaders.indexOf('Email');
    if (dbEmailIdx === -1) return JSON.stringify({ success: false, error: 'Email column not found in System_DB.' });
    
    var dbAllowEditIdx = dbHeaders.indexOf('Allow_Edit');
    if (dbAllowEditIdx === -1) return JSON.stringify({ success: false, error: 'Allow_Edit column not found in System_DB.' });
    
    var dbRowToUpdate = -1;
    for (var i = 1; i < dbData.length; i++) {
      if (dbData[i][dbEmailIdx] && dbData[i][dbEmailIdx].toString().toLowerCase() === email.toLowerCase()) {
        dbRowToUpdate = i + 1;
        break;
      }
    }
    
    if (dbRowToUpdate > -1) {
      dbSheet.getRange(dbRowToUpdate, dbAllowEditIdx + 1).setValue(true);
    } else {
      var newRow = [];
      var mobile = "";
      var dept = "";
      var sheet = getMasterSheet(SpreadsheetApp.getActiveSpreadsheet());
      if (sheet) {
         var data = sheet.getDataRange().getValues();
         if (data.length > 0) {
            var headers = data[0];
            var emailIdx = headers.indexOf('Email address');
            if (emailIdx === -1) emailIdx = headers.indexOf('Email id');
            var mobIdx = headers.indexOf('Mobile No');
            if (mobIdx === -1) mobIdx = headers.indexOf('Mobile number');
            var deptIdx = headers.indexOf('Admission to the Department');
            if (emailIdx !== -1) {
               for (var j = data.length - 1; j >= 1; j--) {
                  if (data[j][emailIdx] && data[j][emailIdx].toString().toLowerCase() === email.toLowerCase()) {
                     if (mobIdx !== -1) mobile = data[j][mobIdx];
                     if (deptIdx !== -1) dept = data[j][deptIdx];
                     break;
                  }
               }
            }
         }
      }
      var dbMobIdx = dbHeaders.indexOf('Mobile_Number');
      if (dbMobIdx === -1) dbMobIdx = dbHeaders.indexOf('Parent_Mobile');
      var dbDeptIdx = dbHeaders.indexOf('Department');
      
      for (var k = 0; k < dbHeaders.length; k++) {
         if (dbHeaders[k] === "Timestamp") newRow.push(new Date());
         else if (k === dbEmailIdx) newRow.push(email);
         else if (k === dbAllowEditIdx) newRow.push(true);
         else if (k === dbMobIdx && mobile) newRow.push(mobile);
         else if (k === dbDeptIdx && dept) newRow.push(dept);
         else newRow.push("");
      }
      dbSheet.appendRow(newRow);
    }
    
    var cache = CacheService.getScriptCache();
    cache.remove('submission_' + email);
    return JSON.stringify({ success: true, message: 'Admission form successfully unlocked for ' + email });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}
