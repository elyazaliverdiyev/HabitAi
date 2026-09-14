import { useState } from 'react';

export const useModals = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isFeedbackListModalOpen, setIsFeedbackListModalOpen] = useState(false);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
    const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false);
    const [isMindMovieOpen, setIsMindMovieOpen] = useState(false);
    const [isWealthDashboardOpen, setIsWealthDashboardOpen] = useState(false);
    const [isAIGoalChainOpen, setIsAIGoalChainOpen] = useState(false);

    const closeAll = () => {
        setIsAddModalOpen(false);
        setIsAIModalOpen(false);
        setIsSettingsModalOpen(false);
        setIsArchiveOpen(false);
        setIsVoiceAssistantOpen(false);
        setIsFeedbackModalOpen(false);
        setIsFeedbackListModalOpen(false);
        setIsActivityModalOpen(false);
        setIsFocusModeOpen(false);
        setIsRewardsModalOpen(false);
        setIsMindMovieOpen(false);
        setIsWealthDashboardOpen(false);
        setIsAIGoalChainOpen(false);
    };

    return {
        isAddModalOpen, setIsAddModalOpen,
        isAIModalOpen, setIsAIModalOpen,
        isSettingsModalOpen, setIsSettingsModalOpen,
        isArchiveOpen, setIsArchiveOpen,
        isVoiceAssistantOpen, setIsVoiceAssistantOpen,
        isFeedbackModalOpen, setIsFeedbackModalOpen,
        isFeedbackListModalOpen, setIsFeedbackListModalOpen,
        isActivityModalOpen, setIsActivityModalOpen,
        isFocusModeOpen, setIsFocusModeOpen,
        isRewardsModalOpen, setIsRewardsModalOpen,
        isMindMovieOpen, setIsMindMovieOpen,
        isWealthDashboardOpen, setIsWealthDashboardOpen,
        isAIGoalChainOpen, setIsAIGoalChainOpen,
        closeAll
    };
};
