interface PaymentSuccessData {
    playlistName: string;
}

interface SubmissionAcceptedData {
    problemTitle: string;
}

export const templates = {
    paymentSuccess: (data: PaymentSuccessData) => {
        return {
            message: `You have successfully purchased the playlist: "${data.playlistName}".`,
        };
    },
    submissionAccepted: (data: SubmissionAcceptedData) => {
        return {
            message: `Congratulations! Your solution for "${data.problemTitle}" passed all test cases.`,
        };
    }
};
