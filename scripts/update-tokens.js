const fs = require('fs');
const path = require('path');
const base = 'c:\\Users\\lanzh\\Documents\\Vibe Coding Works\\SuperGuild';

const replacements = [
    ['text-slate-900', 'text-[#121317]'],
    ['text-slate-800', 'text-[#121317]'],
    ['text-slate-700', 'text-[#45474D]'],
    ['text-slate-600', 'text-[#45474D]'],
    ['text-slate-500', 'text-[#6A6A71]'],
    ['text-slate-400', 'text-[#6A6A71]'],
    ['text-slate-300', 'text-[#D1D5E0]'],
    ['border-slate-200', 'border-[#E8EAF0]'],
    ['border-slate-100', 'border-[#E8EAF0]/60'],
    ['bg-slate-50', 'bg-[#F0F1F5]/50'],
];

const files = [
    'app/profile/page.tsx',
    'components/services/ServiceCard.tsx',
    'components/collaborations/CollabCard.tsx',
    'components/collaborations/MilestoneTimeline.tsx',
    'components/ui/NotificationDrawer.tsx',
    'app/collaborations/[id]/page.tsx',
];

let total = 0;
files.forEach(f => {
    const p = path.join(base, f);
    if (!fs.existsSync(p)) { console.log('SKIP:', f); return; }
    let c = fs.readFileSync(p, 'utf8');
    let count = 0;
    replacements.forEach(([from, to]) => {
        const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(escaped, 'g');
        const matches = c.match(re);
        if (matches) { count += matches.length; c = c.replace(re, to); }
    });
    fs.writeFileSync(p, c);
    console.log('Updated:', f, '(' + count + ' replacements)');
    total += count;
});
console.log('Total:', total);
