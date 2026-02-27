const fs = require('fs');
const crypto = require('crypto');

const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'SG-';
    for (let i = 0; i < 6; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
};

const codes = new Set();
while (codes.size < 100) {
    codes.add(generateCode());
}

const codesArray = Array.from(codes);

// Generate PIONEER_CODES.md
let md = '# 拓世者邀请码 (Pioneer Codes)\n\n';
md += '> ⚠️ 机密文件，请勿提交到公开仓库\n';
md += '> \n';
md += '> 共 100 个名额，先到先得\n\n';
md += '| # | 邀请码 | 状态 |\n';
md += '|:--|:-------|:-----|\n';

codesArray.forEach((code, index) => {
    md += `| ${index + 1} | \`${code}\` | 待领取 |\n`;
});

fs.writeFileSync('PIONEER_CODES.md', md, 'utf8');

// Generate pioneer_seed.sql
let sql = `CREATE TABLE IF NOT EXISTS pioneer_codes (
  code TEXT PRIMARY KEY,
  claimed_by TEXT,
  claimed_at TIMESTAMPTZ,
  tx_hash TEXT
);

`;

codesArray.forEach(code => {
    sql += `INSERT INTO pioneer_codes (code) VALUES ('${code}');\n`;
});

fs.writeFileSync('pioneer_seed.sql', sql, 'utf8');

console.log('Successfully generated 100 codes:');
console.log(' - PIONEER_CODES.md');
console.log(' - pioneer_seed.sql');
