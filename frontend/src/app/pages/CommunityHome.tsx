import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../services/api';

export function CommunityHome() {
  const navigate = useNavigate();

  useEffect(() => {
    const resolveCommunityHome = async () => {
      const userId = localStorage.getItem('userId') || 'me';
      const lastTeamId = localStorage.getItem('lastCommunityTeamId') || '';

      try {
        const teams = await api.getUserTeams(userId);
        if (Array.isArray(teams) && teams.length > 0) {
          const candidate = lastTeamId
            ? teams.find((t: any) => t.id === lastTeamId)
            : null;
          navigate(`/app/community/${(candidate || teams[0]).id}`, { replace: true });
          return;
        }
      } catch {
        // Fall through to join page on failures.
      }
      navigate('/app/join', { replace: true });
    };

    resolveCommunityHome();
  }, [navigate]);

  return <div className="p-6">Loading community...</div>;
}
