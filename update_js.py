import re

def update_js():
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find toggleIndexCalculator
    old_toggle = """    var isIndexCalcOpen = false;
    function toggleIndexCalculator() {
      var panel = document.getElementById('calculator-panel');
      isIndexCalcOpen = !isIndexCalcOpen;
      panel.style.right = isIndexCalcOpen ? '0' : '-360px';
      if(isIndexCalcOpen) {
        if(typeof activeStudent !== 'undefined' && activeStudent) {
            var prog = (activeStudent.Program || "").toLowerCase();
            var select = document.getElementById('calc-dept-select');
            if(prog.includes('mcom') || prog.includes('m.com')) select.value = 'mcom';
            else if(prog.includes('physics') || prog.includes('chem') || prog.includes('botany') || prog.includes('zoology')) select.value = 'msc_science';
            else if(prog.includes('english') || prog.includes('malayalam')) select.value = 'ma_lang';
            else if(prog.includes('maths') || prog.includes('mathematics')) select.value = 'msc_maths';
            else if(prog.includes('history') || prog.includes('economics')) select.value = 'ma_hist_eco';
        }
        renderCalculatorInputs();
      }
    }"""

    new_toggle = """    var isIndexCalcOpen = false;
    function toggleIndexCalculator() {
      var panel = document.getElementById('calculator-panel');
      var modalBox = document.getElementById('detail-modal-box');
      isIndexCalcOpen = !isIndexCalcOpen;
      
      if(isIndexCalcOpen) {
          panel.style.display = 'flex';
          if(modalBox) modalBox.style.maxWidth = '1300px';
          
          if(typeof activeStudent !== 'undefined' && activeStudent) {
              var prog = (activeStudent.Program || "").toLowerCase();
              var select = document.getElementById('calc-dept-select');
              if(prog.includes('mcom') || prog.includes('m.com')) select.value = 'mcom';
              else if(prog.includes('physics') || prog.includes('chem') || prog.includes('botany') || prog.includes('zoology')) select.value = 'msc_science';
              else if(prog.includes('english') || prog.includes('malayalam')) select.value = 'ma_lang';
              else if(prog.includes('maths') || prog.includes('mathematics')) select.value = 'msc_maths';
              else if(prog.includes('history') || prog.includes('economics')) select.value = 'ma_hist_eco';
              
              renderCalculatorInputs();
              
              // Auto-fill NCC
              var nccVal = activeStudent['NCC A/B/C certificate if any'] || activeStudent['NCC/NSS/SPC.  Select any one of the following'] || "";
              var nccStr = String(nccVal).toUpperCase();
              var nccSelect = document.getElementById('calc-ncc');
              if(nccSelect) {
                  if (nccStr.includes("C CERTIFICATE")) nccSelect.value = "10";
                  else if (nccStr.includes("B CERTIFICATE")) nccSelect.value = "5";
                  else if (nccStr.includes("A CERTIFICATE") || nccStr.includes("NCC")) nccSelect.value = "3";
              }

              // Auto-fill NSS
              var nssVal = activeStudent['NCC/NSS/SPC.  Select any one of the following'] || "";
              var nssStr = String(nssVal).toUpperCase();
              var nssSelect = document.getElementById('calc-nss');
              if(nssSelect) {
                  if (nssStr.includes("NSS") || nssStr === "YES") nssSelect.value = "5";
              }
              
              // Auto-fill Calicut University Graduate
              var prevInst = activeStudent['Previous Institution'] || activeStudent['Qualifying mark list (+2 in case of UG admission and Provisional/Degree certificate and consolidated marklist in case of PG admission)'] || "";
              var cuSelect = document.getElementById('calc-cu');
              if(cuSelect) {
                  if (String(prevInst).toUpperCase().includes("CALICUT") || String(prevInst).toUpperCase().includes("UOC")) {
                      cuSelect.value = "1";
                  }
              }
              
              calculateIndex();
          } else {
              renderCalculatorInputs();
          }
      } else {
          panel.style.display = 'none';
          if(modalBox) modalBox.style.maxWidth = '950px';
      }
    }

    function clearCalculator() {
        var inputs = document.querySelectorAll('#calc-dynamic-inputs input');
        inputs.forEach(inp => inp.value = '');
        document.getElementById('calc-cu').value = "0";
        document.getElementById('calc-nss').value = "0";
        document.getElementById('calc-ncc').value = "0";
        calculateIndex();
    }"""
    
    if old_toggle in content:
        content = content.replace(old_toggle, new_toggle)
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Updated JS successfully!")
    else:
        print("Could not find the old toggleIndexCalculator block.")

if __name__ == '__main__':
    update_js()
