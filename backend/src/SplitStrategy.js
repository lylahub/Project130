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
            const percent = split[participant] || 0;
            acc[participant] = parseFloat((amount * (percent / 100)).toFixed(2));
            return acc;
        }, {});
    }
}


