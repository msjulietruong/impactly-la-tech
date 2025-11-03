import pandas as pd

path = "/Users/jushi/Downloads/en.openfoodfacts.org.products.csv"

print("Loading dataset...")
df = pd.read_csv(path, sep='\t', on_bad_lines='skip', low_memory=False, nrows=100000)
print(f"✓ Loaded {len(df)} rows")

# Filter for US/USA products first
print("\nFiltering for US products...")
df_us = df[df['countries_en'].str.contains('United States|USA|US', case=False, na=False, regex=True)]
print(f"✓ Found {len(df_us)} US products")

# Now select only the columns you want
columns_to_keep = [
    'code',
    'packaging_en', 
    'product_name', 
    'origins', 
    'manufacturing_places', 
    'environmental_score_grade', 
    'image_url',
    'brands', 
    'categories'
]

df_filtered = df_us[columns_to_keep]

# Export to CSV
df_filtered.to_csv('openfood_us_filtered.csv', index=False)

print(f"\n✓ Exported successfully!")
print(f"Shape of final file: {df_filtered.shape}")
print(f"Saved to: openfood_us_filtered.csv")