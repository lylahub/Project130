//Interface: SplitStrategy
export class SplitStrategy {
    calculateShare(amount, participants, split) {
        throw new Error("Abstract");
    }
}

//Concrete strategy: Equal Split Strategy
export class EqualSplitStrategy extends SplitStrategy {
    calculateShare(amount, participants) {
        if (!participants || participants.length === 0) {
            throw new Error("Participants array cannot be empty");
          }
        //Equal split ratio
        let defaultSplit = 1/participants.length
        //create an object mapping, acc[participation] is the share for the participant
        return participants.reduce((acc, participant) => {
            acc[participant] = amount * defaultSplit;
            return acc;
        }, {});
        
    }
}

//Concrete strategy: CustomSplitStrategy
export class CustomSplitStrategy extends SplitStrategy {
    calculateShare(amount, participants, split) {
        if (!participants || participants.length === 0) {
            throw new Error("Participants array cannot be empty");
          }
        return participants.reduce((acc, participant) => {
            //when no percent is input, treat the share for the parcipant as 0
            const percent = split[participant] || 0;
            // Calculate the participant's share and round to 2 decimal places
            acc[participant] = parseFloat((amount * (percent / 100)).toFixed(2));
            return acc;
        }, {});
    }
}


