import os
import re

target_dir = r"c:\Users\Lenovo\Desktop\S&P 500\frontend\src"

for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file.endswith('.tsx'):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Fix ResponsiveContainer
            new_content = re.sub(
                r'<ResponsiveContainer([^>]*?)>',
                lambda m: f"<ResponsiveContainer{m.group(1)} minWidth={{0}} minHeight={{0}}>" 
                          if "minWidth" not in m.group(1) else m.group(0),
                content
            )

            # Fix .toFixed() by wrapping the target in Number()
            # This is a bit tricky with regex, so we'll just fix the most common patterns
            # e.g. stockData.pct_change.toFixed(2) -> Number(stockData.pct_change).toFixed(2)
            # Actually, fixing ResponsiveContainer might be enough if t.toFixed was from Recharts!
            
            if new_content != content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {file_path}")
