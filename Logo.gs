/**
 * Helper to fetch a file from the shared Drive folder by name and convert it to Base64.
 */
function getDriveImageAsBase64(possibleNames) {
  try {
    var folderId = "1_h8PpE_5tpocyIwPi3iIzx0DvYA17Js5";
    var folder = DriveApp.getFolderById(folderId);
    for (var i = 0; i < possibleNames.length; i++) {
      var files = folder.getFilesByName(possibleNames[i]);
      if (files.hasNext()) {
        var file = files.next();
        var blob = file.getBlob();
        var contentType = blob.getContentType();
        var bytes = blob.getBytes();
        return "data:" + contentType + ";base64," + Utilities.base64Encode(bytes);
      }
    }
  } catch (e) {
    console.error("Error fetching files from Google Drive: " + possibleNames.join(", "), e);
  }
  return "";
}

/**
 * Returns the Base64 encoded string of the College Logo.
 */
function getLogoBase64() {
  return getDriveImageAsBase64(["CollegeLogo.png", "CollegeLogo.jpg", "CollegeLogo.jpeg", "CollegeLogo", "logo.png", "logo.jpg", "logo.jpeg", "logo"]);
}

/**
 * Returns the Base64 encoded string of the Principal's Signature.
 */
function getPrincipalSignatureBase64() {
  return getDriveImageAsBase64(["signature.png", "signature.jpg", "signature.jpeg", "sig.png", "sig.jpg", "signature"]);
}

/**
 * Returns the Base64 encoded string of the College Seal.
 */
function getCollegeSealBase64() {
  return getDriveImageAsBase64(["seal.png", "seal.jpg", "seal.jpeg", "seal"]);
}
