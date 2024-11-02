export class SplitStrategy {
    calculateShare(amount, participants, split) {
        throw new Error("Abstract");
    }
}
export class EqualSplitStrategy extends SplitStrategy {
    calculateShare(amount, participants) {
        let defaultSplit = 1/participants.length
        return participants.reduce((acc, participant) => {
            acc[participant] = amount * defaultSplit;
            return acc;
        }, {});
        
    }
}

export class CustomSplitStrategy extends SplitStrategy {
    calculateShare(amount, participants, split) {
        return participants.reduce((acc, participant) => {
            const personalSplit = split[participant] || (1 / participants.length);
            acc[participant] = amount * personalSplit;
            return acc;
        }, {});
    }
} 

