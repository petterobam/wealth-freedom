#!/bin/bash

# 修复 API 方法名

cd "/Users/oyj/.openclaw/workspace/财富自由之路/产品研发/code/wealth-freedom/apps/desktop/src/renderer/src/stores"

# accounts.ts
perl -i -pe 's/window\.electronAPI\.account\.getAll\(\)/window.electronAPI.getAccounts()/g' accounts.ts
perl -i -pe 's/window\.electronAPI\.account\.create\(/window.electronAPI.createAccount(/g' accounts.ts
perl -i -pe 's/window\.electronAPI\.account\.update\(([^,]+),\s*/window.electronAPI.updateAccount({ id: $1, /g' accounts.ts
perl -i -pe 's/window\.electronAPI\.account\.delete\(/window.electronAPI.deleteAccount(/g' accounts.ts

# debts.ts
perl -i -pe 's/window\.electronAPI\.debt\.getAll\(\)/window.electronAPI.getDebts()/g' debts.ts
perl -i -pe 's/window\.electronAPI\.debt\.create\(/window.electronAPI.createDebt(/g' debts.ts
perl -i -pe 's/window\.electronAPI\.debt\.update\(([^,]+),\s*/window.electronAPI.updateDebt({ id: $1, /g' debts.ts
perl -i -pe 's/window\.electronAPI\.debt\.delete\(/window.electronAPI.deleteDebt(/g' debts.ts

# goals.ts
perl -i -pe 's/window\.electronAPI\.goal\.getAll\(\)/window.electronAPI.getGoals()/g' goals.ts
perl -i -pe 's/window\.electronAPI\.goal\.create\(/window.electronAPI.createGoal(/g' goals.ts
perl -i -pe 's/window\.electronAPI\.goal\.update\(([^,]+),\s*/window.electronAPI.updateGoal({ id: $1, /g' goals.ts
perl -i -pe 's/window\.electronAPI\.goal\.delete\(/window.electronAPI.deleteGoal(/g' goals.ts

# transactions.ts
perl -i -pe 's/window\.electronAPI\.transaction\.getAll\(/window.electronAPI.getTransactions(/g' transactions.ts
perl -i -pe 's/window\.electronAPI\.transaction\.create\(/window.electronAPI.createTransaction(/g' transactions.ts
perl -i -pe 's/window\.electronAPI\.transaction\.update\(([^,]+),\s*/window.electronAPI.updateTransaction({ id: $1, /g' transactions.ts
perl -i -pe 's/window\.electronAPI\.transaction\.delete\(/window.electronAPI.deleteTransaction(/g' transactions.ts

echo "所有 API 方法名已修复！"
