import json
import os

# 1. Paste your massive Python lists of quotes here!
# For example:
# one_piece_quotes = [ ("Quote", "Author", "Source", "Category"), ... ]
# naruto_quotes = [ ("Quote", "Author", "Source", "Category"), ... ]

# 2. Combine them into one big list
# all_quotes_tuples = one_piece_quotes + naruto_quotes + black_clover_quotes + solo_leveling_quotes + hollywood_quotes

# --- Example placeholder so the script runs (replace this with your actual combined lists) ---
all_quotes_tuples = [
    ("The weak make excuses. The strong make progress.", "Sung Jinwoo", "Solo Leveling", "Solo Leveling"),
    ("I'm going to be King of the Pirates!", "Monkey D. Luffy", "One Piece", "One Piece"),
]
# ---------------------------------------------------------------------------------------------

# 3. Convert the tuples into a list of dictionaries
json_quotes = []
for quote_tuple in all_quotes_tuples:
    # Some of your tuples have 4 items (quote, author, source, category)
    if len(quote_tuple) >= 3:
        text = quote_tuple[0]
        author = quote_tuple[1]
        source = quote_tuple[2]
        
        json_quotes.append({
            "text": text,
            "author": author,
            "source": source
        })

# 4. Save to quotes.json
output_file = os.path.join(os.path.dirname(__file__), "quotes.json")

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(json_quotes, f, indent=2, ensure_ascii=False)

print(f"Successfully converted {len(json_quotes)} quotes and saved to {output_file}!")
