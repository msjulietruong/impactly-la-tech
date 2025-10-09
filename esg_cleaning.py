# Data cleaning for ESG Kaggle Dataset

import pandas as pd

df = pd.read_csv('/Users/jushi/Downloads/data.csv',
    na_values = ['N/A', 'n/a', 'na', 'NA'])

# print('Before cleaning:')
missing_vals = df.isnull().sum() # marks the N/a as null amount

# print(missing_vals)

df['industry'] = df['industry'].fillna('Industry Not Available')
df['logo'] = df['logo'].fillna('Logo Not Provided')
df['weburl'] = df['weburl'].fillna('Url Not Provided')

# missing_vals = df.isnull().sum() # SHould not have any missing vals now

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

df[score_columns] = df[score_columns].round(0).astype(int)

df = df.drop(columns=['exchange', 'currency', 'industry'])

# cleaned columns and such
print(df[['name', 'environment_score', 'environment_grade', 'social_score', 'social_grade', 'governance_grade', 'governance_score', 'total_score']].head(10))

df.to_csv('/Users/jushi/Desktop/cleaned_esg.csv', index=False)



