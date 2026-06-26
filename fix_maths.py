import re

def fix_maths():
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    old_maths = """      } else if(dept === 'msc_maths') {
         var core = getVal('calc-core');
         var comp1 = getVal('calc-comp1');
         var comp2 = getVal('calc-comp2');
         
         var cg1 = (core*55 + comp1*12 + comp2*12) / 79;
         index = (cg1 + core) * 5;
         if(cu) bonusWeightage = (index * 5)/100;"""

    new_maths = """      } else if(dept === 'msc_maths') {
         var core = getVal('calc-core');
         var comp1 = getVal('calc-comp1');
         var comp2 = getVal('calc-comp2');
         
         // Mathematics uses a simple average for CG1
         var cg1 = (core + comp1 + comp2) / 3;
         index = (cg1 + core) * 5;
         if(cu) bonusWeightage = (index * 5)/100;"""

    if old_maths in content:
        content = content.replace(old_maths, new_maths)
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Updated index.html")
    else:
        print("Could not find the target string.")

if __name__ == '__main__':
    fix_maths()
