import re

def fix_logic():
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update dropdown options
    old_option = '<option value="ma_hist_eco">M.A. History / Economics</option>'
    new_option = '<option value="ma_history">M.A. History</option>\n            <option value="ma_economics">M.A. Economics</option>'
    content = content.replace(old_option, new_option)

    # 2. Update auto-select
    old_select = "else if(prog.includes('history') || prog.includes('economics')) select.value = 'ma_hist_eco';"
    new_select = "else if(prog.includes('history')) select.value = 'ma_history';\n              else if(prog.includes('economics')) select.value = 'ma_economics';"
    content = content.replace(old_select, new_select)

    # 3. Update renderInputs
    old_render = "} else if (dept === 'ma_hist_eco') {"
    new_render = "} else if (dept === 'ma_history' || dept === 'ma_economics') {"
    content = content.replace(old_render, new_render)

    # 4. Update calculateIndex for Maths
    old_math = """      } else if(dept === 'msc_maths') {
         var core = getVal('calc-core');
         var comp1 = getVal('calc-comp1');
         var comp2 = getVal('calc-comp2');
         
         var cg1 = (core*55 + comp1*12 + comp2*12) / 79;
         index = (cg1 + core) * 5 * 1.05;
         if(cu) bonusWeightage = (index * 5)/100;"""
    
    new_math = """      } else if(dept === 'msc_maths') {
         var core = getVal('calc-core');
         var comp1 = getVal('calc-comp1');
         var comp2 = getVal('calc-comp2');
         
         var cg1 = (core*55 + comp1*12 + comp2*12) / 79;
         index = (cg1 + core) * 5;
         if(cu) bonusWeightage = (index * 5)/100;"""
    content = content.replace(old_math, new_math)

    # 5. Update calculateIndex for History/Economics
    old_hist = """      } else if(dept === 'ma_hist_eco') {
         var overall = getVal('calc-overall');
         var core = getVal('calc-core');
         var total = (overall * 120 + core * 63) / 24;
         subBonus = (total * 10) / 100;
         index = total + subBonus;
         if(cu) bonusWeightage = (total * 5)/100;
      }"""
      
    new_hist = """      } else if(dept === 'ma_history') {
         var overall = getVal('calc-overall');
         var core = getVal('calc-core');
         var total = (overall * 120 + core * 63) / 24;
         subBonus = (total * 10) / 100;
         index = total + subBonus;
         if(cu) bonusWeightage = (total * 5)/100;
      } else if(dept === 'ma_economics') {
         var overall = getVal('calc-overall');
         var core = getVal('calc-core');
         var total = (overall * 120 + core * 63) / 18.3;
         subBonus = (total * 10) / 100;
         index = total + subBonus;
         if(cu) bonusWeightage = (total * 5)/100;
      }"""
    content = content.replace(old_hist, new_hist)

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    fix_logic()
