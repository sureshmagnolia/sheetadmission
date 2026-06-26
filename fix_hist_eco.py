import re

def fix_history_eco():
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    old_hist_eco = """      } else if(dept === 'ma_history') {
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

    new_hist_eco = """      } else if(dept === 'ma_history') {
         var overall = getVal('calc-overall');
         var core = getVal('calc-core');
         // History CC = 120
         var total = (overall * 120 + core * 120) / 24;
         subBonus = (total * 10) / 100;
         index = total + subBonus;
         if(cu) bonusWeightage = (total * 5)/100;
      } else if(dept === 'ma_economics') {
         var overall = getVal('calc-overall');
         var core = getVal('calc-core');
         // Economics CC = 63
         var total = (overall * 120 + core * 63) / 18.3;
         subBonus = (total * 10) / 100;
         index = total + subBonus;
         if(cu) bonusWeightage = (total * 5)/100;
      }"""

    if old_hist_eco in content:
        content = content.replace(old_hist_eco, new_hist_eco)
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Updated history/economics")
    else:
        print("Could not find the target string.")

if __name__ == '__main__':
    fix_history_eco()
