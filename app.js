function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // --- FITUR RETRIEVE DATA (LOGIN & SYNC) ---
  if (data.action === 'login') {
    const userSheet = ss.getSheetByName('Users');
    if (!userSheet) {
      return res({ success: false, error: 'Sheet Users belum dibuat.' });
    }
    const users = userSheet.getDataRange().getValues();
    for (let i = 1; i < users.length; i++) {
      if (users[i][0] === data.username && users[i][1] === data.password) {
        return res({
          success: true,
          user: { username: users[i][0], name: users[i][2], role: users[i][3] }
        });
      }
    }
    return res({ success: false, error: 'Username atau password salah!' });
  }

  if (data.action === 'register') {
    const userSheet = ss.getSheetByName('Users');
    const users = userSheet.getDataRange().getValues();
    
    // Cek apakah username sudah terpakai
    for (let i = 1; i < users.length; i++) {
      if (users[i][0] === data.username) {
        return res({ success: false, error: 'Username sudah terdaftar!' });
      }
    }
    
    userSheet.appendRow([
      data.username,
      data.password, // Direkomendasikan enkripsi di sisi klien/kombinasi
      data.name,
      'User',
      new Date().toISOString()
    ]);
    return res({ success: true, message: 'Registrasi berhasil!' });
  }
  
  if (data.action === 'sync') {
    const sheet = ss.getSheetByName('Inventory');
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 10).clear();
    }
    
    const rows = data.data.map(item => [
      item.id, item.code, item.name, item.category, 
      item.stock, item.cost, item.price, item.location, 
      item.notes, item.updatedAt
    ]);
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, 10).setValues(rows);
    }
    
    return res({ success: true, message: 'Data inventaris sinkron!' });
  }
  
  return res({ success: false, error: 'Aksi tidak dikenal' });
}

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Inventory');
  const data = sheet.getDataRange().getValues();
  const items = [];
  
  for (let i = 1; i < data.length; i++) {
    items.push({
      id: data[i][0], code: data[i][1], name: data[i][2], category: data[i][3],
      stock: data[i][4], cost: data[i][5], price: data[i][6], location: data[i][7],
      notes: data[i][8], updatedAt: data[i][9]
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify(items))
    .setMimeType(ContentService.MimeType.JSON);
}

// Helper Response
function res(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
