const en = {
    // ── Common ──
    common: {
        connectWallet: 'Connect Wallet',
        connected: 'Connected',
        loading: 'Loading...',
        noData: 'No data yet',
        submit: 'Submit',
        cancel: 'Cancel',
        save: 'Save',
        edit: 'Edit',
        viewAll: 'View All',
        learnMore: 'Learn More',
        activate: 'Activate',
        manage: 'Manage',
        comingSoon: 'Coming Soon',
        active: 'Active',
        idle: 'Idle',
        completed: 'Completed',
        inProgress: 'In Progress',
        locked: 'Locked',
        pending: 'Pending',
        cancelled: 'Cancelled',
        disputed: 'Disputed',
        getStarted: 'Get Started',
        viewDocs: 'View Docs',
        all: 'All',
    },

    // ── Nav ──
    nav: {
        dashboard: 'Dashboard',
        services: 'Services',
        bounties: 'Bounties',
        governance: 'Governance',
        docs: 'Bulletin',
        profile: 'Profile',
    },

    // ── Landing / Hero ──
    landing: {
        badge: 'Protocol V2 Live',
        heroTitle: 'Infrastructure for',
        heroHighlight: 'Super Individual',
        heroDescription: 'Decentralized Guilds in the AI Era — Abolish All Intermediaries, Labor Value Belongs Solely to the Individual.',
        featureServices: 'Universal Service Hub',
        featureServicesDesc: 'Focus on creation, leave the rest to the guild.',
        featureCollabs: 'Task-based Collaboration Network',
        featureCollabsDesc: 'Task board, division of labor among equal individuals.',
        featureVCP: 'Decentralized Credit Governance',
        featureVCPDesc: 'SBT credit points, DAO governance system, trust without endorsements.',
    },

    // ── Dashboard ──
    dashboard: {
        title: 'Dashboard',
        vcpScore: 'VCP Score',
        activeQuests: 'Active Quests',
        recentQuests: 'Recent Quests',
        quickActions: 'Quick Actions',
        newQuest: 'New Quest',
        browseServices: 'Browse Services',
        questTitle: 'Quest',
        status: 'Status',
        budget: 'Budget',
    },

    // ── Services ──
    services: {
        title: 'Service Center',
        subtitle: 'Browse and activate infrastructure services, on-demand.',
        heroTitle: 'Infrastructure for the',
        heroHighlight: 'Sovereign Individual',
        heroDescription: 'Decentralized, non-custodial tools to power your professional autonomy on Base. Activate services instantly.',
        availableServices: 'Available Services',
        activeContracts: 'Active Contracts',
        serviceName: 'Service Name',
        contractHash: 'Contract Hash',
        uptime: 'Uptime',
        activationDate: 'Activation Date',
        infrastructure: 'Infrastructure',
        specialized: 'Specialized',
        consulting: 'Consulting',
    },

    // ── Collaborations / Quests ──
    quests: {
        title: 'Quest Board',
        subtitle: 'Create or join P2P collaboration quests.',
        newQuest: 'New Quest',
        allQuests: 'All',
        activeQuests: 'Active',
        pendingQuests: 'Pending',
        completedQuests: 'Completed',
        cancelledQuests: 'Cancelled',
        noQuests: 'No quests yet',
        noQuestsDesc: 'Create your first P2P collaboration quest.',
        noQuestsFilterDesc: 'No quests matching this filter.',
        budget: 'Budget',
        created: 'Created',
        workspace: 'Workspace',
        milestones: 'Milestones',
        filesAssets: 'Files & Assets',
        discussion: 'Discussion',
        escrowMonitor: 'Escrow Monitor',
        totalValueLocked: 'Total Value Locked',
        fundsReleased: 'Funds Released',
        milestoneConsole: 'Milestone Console',
        submitDeliverable: 'Submit Deliverable',
        submitForReview: 'Submit for Review',
        pasteLinkPlaceholder: 'Paste Github PR or File Link...',
        uploadFile: 'Upload File',
        addNote: 'Add Note',
        viewDeliverable: 'View Deliverable',
        viewSpec: 'View Spec',
        newMilestone: 'New Milestone',
    },

    // ── Profile ──
    profile: {
        title: 'Profile',
        editProfile: 'Edit Profile',
        reputationScore: 'Reputation Score',
        vcpPoints: 'VCP Points',
        soulboundTokens: 'Soulbound Tokens',
        recentContributions: 'Recent Contributions',
        projectTask: 'Project / Task',
        date: 'Date',
        reward: 'Reward',
        loadMore: 'Load More History',
        username: 'Username',
        email: 'Email',
        telegram: 'Telegram',
        bio: 'Bio',
        bioPlaceholder: 'Tell us about yourself and your skills...',
        topContributor: 'Top Contributor',
        anonymous: 'Anonymous',
    },

    // ── Notifications ──
    notifications: {
        title: 'Antigravity Center',
        subtitle: 'Global Notifications',
        markAllRead: 'Mark all read',
        noNotifications: 'No notifications',
        today: 'Today',
        yesterday: 'Yesterday',
        earlier: 'Earlier',
        financial: 'Financial',
        project: 'Project',
        reputation: 'Reputation',
        viewSettings: 'View Notification Settings',
    },

    // ── Pioneer ──
    pioneer: {
        title: 'Pioneer Program',
        claimVCP: 'Claim VCP',
        inviteCode: 'Invite Code',
        enterCode: 'Enter invite code...',
    },

    // ── Bulletin Board ──
    bulletin: {
        title: 'Bulletin Board',
        subtitle: 'Guild announcements and updates',
        pinned: 'Pinned',
        noBulletins: 'No announcements yet',
        attachment: 'Attachment',
        attachments: 'Attachments',
        general: 'General',
        update: 'Update',
        event: 'Event',
    },

    // ── Privilege Badges ──
    badges: {
        title: 'Privilege Badges',
        pioneerName: 'Pioneer Memorial',
        pioneerDesc: '1.05x VCP Settlement Boost',
        flameName: 'The First Flame',
        flameDesc: 'Direct Proposal in Lantern Parliament',
        lanternName: 'Lantern Keeper\\\'s Lamp',
        lanternDesc: '1.1x On-chain Voting Weight',
        clickToView: 'Enter 3D Showcase',
        privilegeBadge: 'Super Guild Privilege Badge'
    },

    // ── Footer ──
    footer: {
        copyright: '© 2026 SuperGuild Protocol',
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
        documentation: 'Documentation',
        support: 'Support',
    },
};

export default en;
export type TranslationKeys = {
    [K in keyof typeof en]: {
        [P in keyof typeof en[K]]: string;
    }
};
