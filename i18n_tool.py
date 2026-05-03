#!/usr/bin/env python3
"""
i18n tool: Extract Chinese strings from Vue files and generate i18n replacements.
This is a semi-automated tool that generates replacement mappings.
"""
import re, os, json

VIEWS_DIR = 'apps/desktop/src/renderer/src/views'
FILES = [
    ('AIAdvice', 'aiAdvice'),
    ('AssetAllocation', 'assetAllocation'),
    ('BigScreen', 'bigscreen'),
    ('Calculator', 'calculator'),
    ('Debts', 'debts'),
    ('Dreams', 'dreams'),
    ('IncomeActions', 'incomeActions'),
    ('IncomeAnalysis', 'incomeAnalysis'),
    ('IncomeDashboard', 'incomeDashboard'),
    ('IncomeGoals', 'incomeGoals'),
    ('IncomeStrategies', 'incomeStrategies'),
    ('Insights', 'insights'),
    ('LargeExpensePlanner', 'largeExpense'),
    ('License', 'license'),
    ('PdfReport', 'pdfReport'),
    ('PrepaymentCalculator', 'prepaymentCalc'),
    ('RetirementPlanner', 'retirement'),
    ('ScenarioSimulator', 'scenario'),
    ('Welcome', 'welcome'),
]

def has_chinese(s):
    return bool(re.search(r'[\u4e00-\u9fff]', s))

def extract_chinese_from_template(content, ns):
    """Extract Chinese strings from template section and generate replacements."""
    # Split at <style
    style_idx = content.rfind('<style')
    if style_idx > 0:
        template_script = content[:style_idx]
    else:
        template_script = content
    
    # Find template and script boundaries
    template_start = template_script.find('<template>')
    template_end = template_script.find('</template>')
    script_start = template_script.find('<script')
    script_end = template_script.find('</script>')
    
    template_section = template_script[template_start:template_end] if template_start >= 0 else ''
    script_section = template_script[script_start:script_end] if script_start >= 0 else ''
    
    return template_section, script_section

# Process each file
for filename, ns in FILES:
    path = os.path.join(VIEWS_DIR, f'{filename}.vue')
    with open(path) as f:
        content = f.read()
    
    template_section, script_section = extract_chinese_from_template(content, ns)
    
    # Collect all Chinese strings in template
    template_lines = template_section.split('\n')
    chinese_in_template = []
    for i, line in enumerate(template_lines):
        if has_chinese(line):
            chinese_in_template.append((i, line))
    
    print(f"\n{'='*60}")
    print(f"FILE: {filename}.vue (ns: {ns})")
    print(f"Chinese lines in template: {len(chinese_in_template)}")
    for i, line in chinese_in_template[:5]:
        print(f"  L{i}: {line.strip()[:80]}")
    if len(chinese_in_template) > 5:
        print(f"  ... and {len(chinese_in_template)-5} more")
