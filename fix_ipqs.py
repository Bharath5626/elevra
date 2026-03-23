path = "D:/elevra/career-ai-studio/backend/app/auth/disposable_domains.py"

with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if 'blocked = bool(data.get("disposable")) or int(data.get("fraud_score"' in line:
        # Replace the fraud_score line with disposable-only check
        indent = "        "
        new_lines.append(indent + "# Only block on disposable=True. fraud_score also rates the username\n")
        new_lines.append(indent + "# and causes false positives on real addresses like test@gmail.com.\n")
        new_lines.append(indent + 'blocked = bool(data.get("disposable"))\n')
    elif 'log.info("IPQS blocked %s (disposable=%s fraud=%s)"' in line:
        indent = "            "
        new_lines.append(indent + 'log.info("IPQS blocked %s (disposable=True fraud=%s)", email, data.get("fraud_score"))\n')
    else:
        new_lines.append(line)

with open(path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Done. Verifying...")
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
if "fraud_score" in content and "fraud_score\", 0)) >= 85" not in content:
    print("OK - fraud_score threshold removed, only logging it now")
else:
    print("ERROR - check the file")
