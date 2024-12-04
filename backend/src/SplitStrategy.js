//Interface: SplitStrategy
/**
 * Abstract base class for split strategies.
 * Represents the strategy interface for calculating share distributions.
 * @abstract
 */
export class SplitStrategy {
    /**
     * Abstract method to calculate share distribution.
     * Must be implemented by subclasses.
     * @param {number} amount - The total amount to be split.
     * @param {string[]} participants - Array of participant identifiers.
     * @param {Object} [split] - Optional custom split percentages for participants.
     * @returns {Object} An object mapping participants to their respective shares.
     * @throws Will throw an error if not implemented in a subclass.
     */
    calculateShare(amount, participants, split) {
        throw new Error("Abstract");
    }
}

/**
 * Concrete strategy for custom share distribution.
 * Extends the SplitStrategy class to implement custom splitting logic.
 */
export class EqualSplitStrategy extends SplitStrategy {
    /**
     * Calculates shares based on custom percentages provided for participants.
     * @param {number} amount - The total amount to be split.
     * @param {string[]} participants - Array of participant identifiers.
     * @param {Object} split - An object mapping participants to their respective percentages.
     * @returns {Object} An object mapping participants to their custom-calculated shares.
     * @throws Will throw an error if the participants array is empty.
     */
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


