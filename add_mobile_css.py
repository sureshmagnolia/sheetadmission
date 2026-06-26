import re

def update_html():
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add CSS block
    css_block = """    /* MOBILE RESPONSIVE CARD TABLES */
    @media (max-width: 768px) {
      .mobile-card-table {
        border: 0 !important;
      }
      .mobile-card-table table, 
      .mobile-card-table thead, 
      .mobile-card-table tbody, 
      .mobile-card-table th, 
      .mobile-card-table td, 
      .mobile-card-table tr { 
        display: block; 
      }
      .mobile-card-table thead tr { 
        position: absolute;
        top: -9999px;
        left: -9999px;
      }
      .mobile-card-table tr { 
        margin-bottom: 15px;
        border: 1px solid var(--card-border) !important;
        border-radius: 8px;
        background: rgba(15, 23, 42, 0.4);
        padding: 8px 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .mobile-card-table td { 
        border: none !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.03) !important; 
        position: relative;
        padding: 8px 10px 8px 45% !important; 
        text-align: right !important;
        min-height: 36px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        font-size: 0.85rem;
      }
      .mobile-card-table td:last-child {
        border-bottom: 0 !important;
      }
      .mobile-card-table td::before { 
        content: attr(data-label); 
        position: absolute;
        left: 10px;
        width: 40%; 
        white-space: nowrap;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        font-size: 0.7rem;
        text-align: left;
      }
      
      /* Detail Modal Mobile Layout */
      .detail-modal-box {
        flex-direction: column !important;
        overflow-y: auto;
      }
      #calculator-panel {
        width: 100% !important;
        max-width: 100% !important;
        border-left: none !important;
        border-top: 1px solid var(--card-border);
      }
    }
"""
    if "/* MOBILE RESPONSIVE CARD TABLES */" not in content:
        # Insert before </style>
        content = content.replace("  </style>", css_block + "  </style>")

    # 2. Add class to existing tables in HTML
    # Student Table Card
    content = content.replace('<div class="table-responsive">', '<div class="table-responsive mobile-card-table">')

    # 3. Update JavaScript TD generation

    # STUDENT TABLE ROWS
    old_tds = """                       "<td><strong>" + admNo + "</strong></td>" +
                       "<td><strong>" + token + "</strong></td>" +
                       "<td>" + capid + "</td>" +
                       "<td>" + name + "</td>" +
                       deptCell +
                       "<td>" + email + "</td>" +
                       "<td>" + indexMark + "</td>" +
                       "<td>" + verifiedIndex + "</td>" +
                       "<td>" + assignedSlot + "</td>" +
                       "<td><strong>" + ptaAmount + "</strong></td>" +
                        "<td><span class='status-badge status-" + status.replace(/\s+/g, '_') + "'>" + status.replace('_', ' ') + "</span>" +"""
    
    new_tds = """                       "<td data-label='Adm No'><strong>" + admNo + "</strong></td>" +
                       "<td data-label='Token'><strong>" + token + "</strong></td>" +
                       "<td data-label='CAP ID'>" + capid + "</td>" +
                       "<td data-label='Name'>" + name + "</td>" +
                       (isCentral ? ("<td data-label='Department'>" + (s["Department"] || "-") + "</td>") : "") +
                       "<td data-label='Email/Phone'>" + email + "</td>" +
                       "<td data-label='Index Mark'>" + indexMark + "</td>" +
                       "<td data-label='Verified Index'>" + verifiedIndex + "</td>" +
                       "<td data-label='Slot'>" + assignedSlot + "</td>" +
                       "<td data-label='PTA Fee'><strong>" + ptaAmount + "</strong></td>" +
                        "<td data-label='Status'><span class='status-badge status-" + status.replace(/\s+/g, '_') + "'>" + status.replace('_', ' ') + "</span>" +"""

    content = content.replace(old_tds, new_tds)
    
    # STUDENT TABLE DEPT CELL FIX
    content = content.replace('var deptCell = isCentral ? ("<td>" + (s["Department"] || "-") + "</td>") : "";', '// deptCell moved inline')

    # STUDENT TABLE ACTIONS
    old_action = """"<td><button class='btn btn-secondary' style='padding: 4px 10px; font-size: 0.8rem;'>Verify</button></td>";"""
    new_action = """"<td data-label='Action'><button class='btn btn-secondary' style='padding: 4px 10px; font-size: 0.8rem;'>Verify</button></td>";"""
    content = content.replace(old_action, new_action)

    # PTA HISTORY TABLE
    old_pta = """"<td>" + (index + 1) + "</td>" +
          "<td>" + capid + "</td>" +
          "<td>" + name.toUpperCase() + "</td>" +
          "<td>" + deptName + "</td>" +
          "<td>" + category + "</td>" +
          "<td>" + welfare + "</td>" +
          "<td>" + member + "</td>" +
          "<td>" + voluntary + "</td>" +
          "<td>" + coop + "</td>" +
          "<td>" + idCard + "</td>" +
          "<td>INR " + amount + "/-</td>" +"""
    
    new_pta = """"<td data-label='#'>" + (index + 1) + "</td>" +
          "<td data-label='CAP ID'>" + capid + "</td>" +
          "<td data-label='Name'>" + name.toUpperCase() + "</td>" +
          "<td data-label='Department'>" + deptName + "</td>" +
          "<td data-label='Category'>" + category + "</td>" +
          "<td data-label='Welfare'>" + welfare + "</td>" +
          "<td data-label='Membership'>" + member + "</td>" +
          "<td data-label='Voluntary'>" + voluntary + "</td>" +
          "<td data-label='Coop Store'>" + coop + "</td>" +
          "<td data-label='ID Card'>" + idCard + "</td>" +
          "<td data-label='Amount'>INR " + amount + "/-</td>" +"""
    content = content.replace(old_pta, new_pta)

    # PRINT REGISTRY TABLE
    old_reg = """"<td>" + (index + 1) + "</td>" +
          "<td>" + token + "</td>" +
          "<td>" + capid + "</td>" +
          "<td>" + name.toUpperCase() + "</td>" +
          "<td>" + dept + "</td>" +
          "<td>" + indexMark + "</td>" +
          "<td>" + verifiedIndex + "</td>" +
          "<td>" + assignedSlot + "</td>" +
          "<td><strong>" + ptaAmount + "</strong></td>" +
          "<td>" + status.replace('_', ' ') + "</td>" +
          "<td>" + admNo + "</td>" +"""

    new_reg = """"<td data-label='#'>" + (index + 1) + "</td>" +
          "<td data-label='Token'>" + token + "</td>" +
          "<td data-label='CAP ID'>" + capid + "</td>" +
          "<td data-label='Name'>" + name.toUpperCase() + "</td>" +
          "<td data-label='Department'>" + dept + "</td>" +
          "<td data-label='Index Mark'>" + indexMark + "</td>" +
          "<td data-label='Verified Index'>" + verifiedIndex + "</td>" +
          "<td data-label='Slot'>" + assignedSlot + "</td>" +
          "<td data-label='PTA Fee'><strong>" + ptaAmount + "</strong></td>" +
          "<td data-label='Status'>" + status.replace('_', ' ') + "</td>" +
          "<td data-label='Adm No'>" + admNo + "</td>" +"""
    content = content.replace(old_reg, new_reg)
    
    # SLOTS TABLE
    old_slots = """html += "<td><input type='number' class='form-control' style='width:52px; padding: 4px 6px; text-align: center; font-size: 0.85rem;' data-dept='" + item.Department + "' data-key='" + slot + "' value='" + val + "'></td>";"""
    new_slots = """html += "<td data-label='" + slot + "'><input type='number' class='form-control' style='width:52px; padding: 4px 6px; text-align: center; font-size: 0.85rem;' data-dept='" + item.Department + "' data-key='" + slot + "' value='" + val + "'></td>";"""
    content = content.replace(old_slots, new_slots)

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    update_html()
