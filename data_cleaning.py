import pandas as pd

df = pd.read_csv('/Users/jushi/Downloads/data.csv',
    na_values = ['N/A', 'n/a', 'na', 'NA'])

# print('Before cleaning:')
missing_vals = df.isnull().sum() # marks the N/a as null amount

# print(missing_vals)

df['industry'] = df['industry'].fillna('Industry Not Available')
df['logo'] = df['logo'].fillna('Logo Not Provided')
df['weburl'] = df['weburl'].fillna('Url Not Provided')

missing_vals = df.isnull().sum() # marks the N/a as null amount

# print('After cleaning:')
# print(missing_vals)

# Convert the last_processing_date column to datetime format
df['last_processing_date'] = pd.to_datetime(df['last_processing_date'], format='%d-%m-%Y')

# Change format to day/month/year
df['last_processing_date'] = df['last_processing_date'].dt.strftime('%m/%d/%Y')

# # Print the formatted dates
# print(df['last_processing_date'])

# print(df['total_score'].min())
# print(df['total_score'].max())

# # check range summar:
# print(df['total_score'].describe())

# normalize the data
score_columns = ['total_score', 'governance_score', 'social_score', 'environment_score']

for col in score_columns:
    df[col] = (
        (df[col] - df[col].min()) / (df[col].max() - df[col].min())
    ) * 100 

print(df['environment_grade'].unique())
print(df['social_grade'].unique())
print(df['governance_grade'].unique())

df = df.drop(columns=['exchange', 'currency', 'industry'])



