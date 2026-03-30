import { useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import api from "../api/client";

export function useAcademyWorkspace(user, setUser) {
  const [dashboard, setDashboard] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [courseDetail, setCourseDetail] = useState(null);
  const [presenceFeed, setPresenceFeed] = useState([]);

  useEffect(() => {
    if (!user) return;

    async function loadDashboard() {
      const response = await api.get("/api/dashboard");
      setDashboard(response.data);
      setUser(response.data.user);
      setSelectedCourseId((current) => current || response.data.courses?.[0]?.id || null);
    }

    loadDashboard();
  }, [user, setUser]);

  useEffect(() => {
    if (!selectedCourseId) return;
    api.get(`/api/courses/${selectedCourseId}`).then((response) => setCourseDetail(response.data));
  }, [selectedCourseId]);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("dgToken");
    const client = new Client({
      webSocketFactory: () => new SockJS(`http://localhost:8081/ws?token=${token}`),
      reconnectDelay: 3000,
      onConnect: () => {
        client.subscribe(`/topic/dashboard/${user.id}`, (frame) => {
          const nextDashboard = JSON.parse(frame.body);
          setDashboard(nextDashboard);
          setUser(nextDashboard.user);
        });

        if (selectedCourseId) {
          client.subscribe(`/topic/course-chat/${selectedCourseId}`, (frame) => {
            const incoming = JSON.parse(frame.body);
            setCourseDetail((current) =>
              current ? { ...current, messages: [...current.messages, incoming] } : current
            );
          });
        }

        dashboard?.liveClasses?.forEach((liveClass) => {
          client.subscribe(`/topic/live-class/${liveClass.id}`, (frame) => {
            setPresenceFeed((current) => [JSON.parse(frame.body), ...current].slice(0, 8));
          });
        });
      },
    });

    client.activate();
    return () => client.deactivate();
  }, [user, selectedCourseId, dashboard?.liveClasses, setUser]);

  const refreshDashboard = async () => {
    const response = await api.get("/api/dashboard");
    setDashboard(response.data);
    setUser(response.data.user);
    return response.data;
  };

  const completeLesson = async (courseId = selectedCourseId) => {
    const response = await api.post(`/api/courses/${courseId}/lessons/complete`);
    setDashboard(response.data);
    setUser(response.data.user);
    if (courseId) {
      const detailResponse = await api.get(`/api/courses/${courseId}`);
      setCourseDetail(detailResponse.data);
    }
    return response.data;
  };

  const submitAssessment = async (assessmentId, score) => {
    const response = await api.post("/api/assessments/submit", { assessmentId, score });
    setDashboard(response.data);
    setUser(response.data.user);
    if (selectedCourseId) {
      const detailResponse = await api.get(`/api/courses/${selectedCourseId}`);
      setCourseDetail(detailResponse.data);
    }
    return response.data;
  };

  const sendMessage = async (courseId, message) => {
    await api.post("/api/course-messages", { courseId, message });
  };

  const joinLiveClass = async (liveClassId) => {
    if (user) {
      setPresenceFeed((current) => [
        { name: user.fullName, role: user.role, joinedAt: new Date().toISOString(), userId: user.id },
        ...current,
      ]);
    }
    await api.post(`/api/live-classes/${liveClassId}/join`);
  };

  return {
    dashboard,
    selectedCourseId,
    setSelectedCourseId,
    courseDetail,
    presenceFeed,
    refreshDashboard,
    completeLesson,
    submitAssessment,
    sendMessage,
    joinLiveClass,
  };
}
