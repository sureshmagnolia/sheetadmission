import re

def fix_html():
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Extract the calculator-panel block
    # It starts with '      <!-- Calculator Side Panel -->'
    # and ends right before '      <div class="modal-body">'
    
    start_calc_idx = content.find('      <!-- Calculator Side Panel -->')
    end_calc_idx = content.find('      <div class="modal-body">')
    
    if start_calc_idx == -1 or end_calc_idx == -1:
        print("Could not find calculator panel or modal-body")
        return
        
    calculator_html = content[start_calc_idx:end_calc_idx]
    
    # Remove calculator html from the content
    content = content[:start_calc_idx] + content[end_calc_idx:]
    
    # 2. Find the end of modal-body.
    end_modal_idx = content.find('  <!-- TC Issue Modal -->')
    if end_modal_idx == -1:
        print("Could not find TC Issue Modal")
        return
        
    # Find the closing divs
    match = re.search(r'      </div>\s*</div>\s*</div>\s*<!-- TC Issue Modal -->', content)
    if match:
        insert_pos = match.start() + 13 # after the first </div>\n
    else:
        print("Could not find closing divs")
        return
            
    new_content = content[:insert_pos] + '</div> <!-- End modal-main-content -->\n' + calculator_html + content[insert_pos:]
    
    new_content = new_content.replace('transition: max-width 0.3s ease;">', 'transition: max-width 0.3s ease; max-width: 950px;">')
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("Successfully restructured HTML!")

if __name__ == '__main__':
    fix_html()
