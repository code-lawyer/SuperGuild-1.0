import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { message, context } = await req.json();

        // 1. Log the incoming request (for debugging)
        console.log(`[Agent API] Received:`, message, context);

        // 2. Mock Agent Logic (Rhyme's Personality)
        // In the future, this will connect to Eliza or OpenAI
        let responseText = "";
        const lowerMsg = message.toLowerCase();

        if (lowerMsg.includes('audit')) {
            responseText = "Initiating safety scan on provided contract addresses... [SCANNING]... \n\nAnalysis complete. No critical vulnerabilities found in the standard ERC20 implementation. However, the `renounceOwnership` function is callable. Recommend adding a timelock.";
        } else if (lowerMsg.includes('deploy')) {
            responseText = "I can assist with deployment parameters. based on current gas prices (24 gwei), I recommend setting a bounty minimum of $500 USDC to attract high-quality auditors.";
        } else if (lowerMsg.includes('status')) {
            responseText = "System operational. All nodes online. User Reputation: Level 4. Current active missions: 3.";
        } else {
            responseText = "Command received. I am Rhyme, your Guild AI. I can help you manage missions, audit code, or resolve disputes. What is your directive?";
        }

        // 3. Simulating "Thinking" delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return NextResponse.json({
            reply: responseText,
            agent: "Rhyme",
            timestamp: Date.now()
        });

    } catch (error) {
        console.error("[Agent API] Error:", error);
        return NextResponse.json(
            { error: 'Internal Agent Error' },
            { status: 500 }
        );
    }
}
