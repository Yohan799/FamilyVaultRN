import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchDashboardStats, calculateReadinessScore, DashboardStats } from '@/services/dashboardService';

interface DashboardData {
    stats: DashboardStats;
    readinessScore: number;
}

export const useDashboardData = () => {
    const { user, profile } = useAuth();

    const {
        data,
        isLoading,
        error,
        refetch,
    } = useQuery<DashboardData>({
        queryKey: ['dashboardStats', user?.id],
        queryFn: async () => {
            if (!user?.id) {
                throw new Error('User not authenticated');
            }

            const stats = await fetchDashboardStats(user.id);

            const readinessScore = calculateReadinessScore(
                stats,
                profile?.two_factor_enabled || false,
                profile?.biometric_enabled || false
            );

            return {
                stats,
                readinessScore,
            };
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return {
        stats: data?.stats || {
            documents: 0,
            nominees: 0,
            timeCapsules: 0,
            inactivityTriggerActive: false,
        },
        readinessScore: data?.readinessScore || 0,
        isLoading,
        error,
        refetch,
    };
};
