import { useState, useRef, useEffect, useCallback } from "react";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  API INTEGRATION POINTS                                         ║
// ║  Replace these functions with your actual SQL server calls.     ║
// ║  Each function should return a Promise.                         ║
// ╚══════════════════════════════════════════════════════════════════╝

const API = {
  // POST /api/verify-college
  // Body: { collegeName: string }
  // Expected response: { found: boolean, collegeId?: string }
  verifyCollege: async (collegeName) => {
    // TODO: Replace with your API call
    // return fetch('/api/verify-college', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ collegeName })
    // }).then(r => r.json());
    return { found: false };
  },

  // POST /api/verify-rollnumber
  // Body: { rollNumber: string, collegeId: string }
  // Expected response: { found: boolean, studentId?: string }
  verifyRollNumber: async (rollNumber, collegeId) => {
    // TODO: Replace with your API call
    return { found: false };
  },

  // POST /api/verify-name
  // Body: { name: string, studentId: string }
  // Expected response: { matched: boolean }
  verifyName: async (name, studentId) => {
    // TODO: Replace with your API call
    return { matched: false };
  },

  // POST /api/get-resultcard
  // Body: { studentId: string }
  // Expected response: { found: boolean, resultCard?: { subjects: [...], total: number, grade: string, ... } }
  getResultCard: async (studentId) => {
    // TODO: Replace with your API call
    return { found: false };
  },

  // POST /api/check-registration
  // Body: { studentId: string }
  // Expected response: { registered: boolean }
  checkRegistration: async (studentId) => {
    // TODO: Replace with your API call
    return { registered: false };
  },
};

// ─── FLOW STATES ───
const FLOW = {
  IDLE: "idle",
  ASK_ROLL: "ask_roll",
  ASK_NAME: "ask_name",
  ASK_COLLEGE: "ask_college",
  VERIFYING_COLLEGE: "verifying_college",
  VERIFYING_ROLL: "verifying_roll",
  VERIFYING_NAME: "verifying_name",
  SEARCHING_RESULT: "searching_result",
  CHECKING_REGISTRATION: "checking_registration",
  DONE: "done",
};

const TRIGGER_KEYWORDS = [
  "result", "marksheet", "mark sheet", "marks", "scorecard",
  "score card", "grade", "grades", "result card", "not found",
  "where is my result", "can't find", "cannot find",
];

function detectIntent(text) {
  const lower = text.toLowerCase();
  return TRIGGER_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── COMPONENTS ───

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "6px 0" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#8B8680",
            animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function StepIndicator({ steps, current }) {
  return (
    <div style={{
      display: "flex", gap: 4, alignItems: "center",
      padding: "10px 0 4px", marginBottom: 4,
    }}>
      {steps.map((s, i) => {
        const isActive = i === current;
        const isDone = i < current;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 600,
              background: isDone ? "#1B7D5A" : isActive ? "#185FA5" : "#E8E6DF",
              color: isDone || isActive ? "#fff" : "#8B8680",
              transition: "all 0.3s ease",
            }}>
              {isDone ? "✓" : i + 1}
            </div>
            <span style={{
              fontSize: 11, fontWeight: isActive ? 600 : 400,
              color: isActive ? "#185FA5" : isDone ? "#1B7D5A" : "#8B8680",
              letterSpacing: "0.02em",
            }}>{s}</span>
            {i < steps.length - 1 && (
              <div style={{
                width: 20, height: 1.5,
                background: isDone ? "#1B7D5A" : "#E0DED8",
                margin: "0 2px",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ResultCard({ data }) {
  if (!data) return null;
  return (
    <div style={{
      background: "#FAFAF7", border: "1px solid #E0DED8",
      borderRadius: 12, padding: 18, marginTop: 8,
    }}>
      <div style={{
        fontSize: 13, fontWeight: 700, color: "#185FA5",
        textTransform: "uppercase", letterSpacing: "0.08em",
        marginBottom: 12, borderBottom: "2px solid #185FA5",
        paddingBottom: 8,
      }}>
        Result card
      </div>
      {data.studentName && (
        <div style={{ fontSize: 15, fontWeight: 600, color: "#2C2C2A", marginBottom: 2 }}>
          {data.studentName}
        </div>
      )}
      {data.rollNumber && (
        <div style={{ fontSize: 12, color: "#8B8680", marginBottom: 12 }}>
          Roll no: {data.rollNumber} &middot; {data.collegeName || ""}
        </div>
      )}
      {data.subjects && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E0DED8" }}>
              <th style={{ textAlign: "left", padding: "6px 0", color: "#5F5E5A", fontWeight: 600 }}>Subject</th>
              <th style={{ textAlign: "right", padding: "6px 0", color: "#5F5E5A", fontWeight: 600 }}>Marks</th>
              <th style={{ textAlign: "right", padding: "6px 0", color: "#5F5E5A", fontWeight: 600 }}>Grade</th>
            </tr>
          </thead>
          <tbody>
            {data.subjects.map((s, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #F1EFE8" }}>
                <td style={{ padding: "7px 0", color: "#2C2C2A" }}>{s.name}</td>
                <td style={{ padding: "7px 0", color: "#2C2C2A", textAlign: "right" }}>{s.marks}</td>
                <td style={{ padding: "7px 0", textAlign: "right", fontWeight: 600, color: s.grade === "F" ? "#A32D2D" : "#1B7D5A" }}>{s.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {data.total !== undefined && (
        <div style={{
          display: "flex", justifyContent: "space-between",
          marginTop: 10, paddingTop: 10,
          borderTop: "2px solid #2C2C2A",
          fontWeight: 700, fontSize: 14, color: "#2C2C2A",
        }}>
          <span>Total</span>
          <span>{data.total} &middot; {data.overallGrade || ""}</span>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex", gap: 10,
      flexDirection: isUser ? "row-reverse" : "row",
      alignSelf: isUser ? "flex-end" : "flex-start",
      maxWidth: "85%",
      animation: "msgIn 0.25s ease",
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 600, flexShrink: 0, marginTop: 2,
        background: isUser ? "#185FA5" : "#F1EFE8",
        color: isUser ? "#fff" : "#5F5E5A",
        border: isUser ? "none" : "1px solid #E0DED8",
      }}>
        {isUser ? "You" : "AI"}
      </div>
      <div>
        <div style={{
          padding: "10px 16px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser ? "#E6F1FB" : "#F7F6F3",
          color: "#2C2C2A",
          fontSize: 14, lineHeight: 1.6,
          border: isUser ? "none" : "1px solid #ECEAE4",
        }}>
          {msg.text}
          {msg.stepIndicator && (
            <StepIndicator
              steps={["College", "Roll no.", "Name"]}
              current={msg.stepIndicator}
            />
          )}
          {msg.resultCard && <ResultCard data={msg.resultCard} />}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ───

export default function StudentAgent() {
  const [messages, setMessages] = useState([
    {
      id: 1, role: "assistant",
      text: "Hello! I'm your student support assistant. I can help you find your result card, check your marks, and more. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [flowState, setFlowState] = useState(FLOW.IDLE);
  const [isTyping, setIsTyping] = useState(false);
  const [studentData, setStudentData] = useState({});
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const msgId = useRef(2);

  const scrollDown = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  };

  const addMsg = useCallback((role, text, extra = {}) => {
    const id = msgId.current++;
    setMessages((prev) => [...prev, { id, role, text, ...extra }]);
    scrollDown();
    return id;
  }, []);

  const botReply = useCallback((text, extra = {}, delay = 600) => {
    setIsTyping(true);
    scrollDown();
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsTyping(false);
        addMsg("assistant", text, extra);
        resolve();
      }, delay);
    });
  }, [addMsg]);

  // ─── VERIFICATION FLOW ENGINE ───

  const runVerification = useCallback(async (state, userText) => {
    const data = { ...studentData };

    switch (state) {
      case FLOW.ASK_COLLEGE: {
        data.collegeName = userText.trim();
        setStudentData(data);
        setFlowState(FLOW.VERIFYING_COLLEGE);
        await botReply("Verifying your college...", { stepIndicator: 0 }, 400);

        try {
          const res = await API.verifyCollege(data.collegeName);
          if (res.found) {
            data.collegeId = res.collegeId;
            setStudentData(data);
            setFlowState(FLOW.ASK_ROLL);
            await botReply(
              `College "${data.collegeName}" verified. Now, please enter your roll number.`,
              { stepIndicator: 1 }
            );
          } else {
            setFlowState(FLOW.DONE);
            await botReply(
              `Sorry, the college "${data.collegeName}" was not found in our records. Please contact your admin for assistance.`
            );
          }
        } catch {
          setFlowState(FLOW.DONE);
          await botReply("Something went wrong while verifying the college. Please try again later.");
        }
        break;
      }

      case FLOW.ASK_ROLL: {
        data.rollNumber = userText.trim();
        setStudentData(data);
        setFlowState(FLOW.VERIFYING_ROLL);
        await botReply("Verifying your roll number...", { stepIndicator: 1 }, 400);

        try {
          const res = await API.verifyRollNumber(data.rollNumber, data.collegeId);
          if (res.found) {
            data.studentId = res.studentId;
            setStudentData(data);
            setFlowState(FLOW.ASK_NAME);
            await botReply(
              `Roll number ${data.rollNumber} found. One last step — please enter your full name as registered.`,
              { stepIndicator: 2 }
            );
          } else {
            setFlowState(FLOW.DONE);
            await botReply(
              `Roll number "${data.rollNumber}" was not found under ${data.collegeName}. Please double-check or contact your admin.`
            );
          }
        } catch {
          setFlowState(FLOW.DONE);
          await botReply("Something went wrong while verifying the roll number. Please try again later.");
        }
        break;
      }

      case FLOW.ASK_NAME: {
        data.studentName = userText.trim();
        setStudentData(data);
        setFlowState(FLOW.VERIFYING_NAME);
        await botReply("Verifying your name...", { stepIndicator: 2 }, 400);

        try {
          const res = await API.verifyName(data.studentName, data.studentId);
          if (res.matched) {
            setFlowState(FLOW.SEARCHING_RESULT);
            await botReply("Identity verified! Searching for your result card...", {}, 500);

            const resultRes = await API.getResultCard(data.studentId);
            if (resultRes.found) {
              setFlowState(FLOW.DONE);
              await botReply("Here is your result card:", {
                resultCard: {
                  studentName: data.studentName,
                  rollNumber: data.rollNumber,
                  collegeName: data.collegeName,
                  ...resultRes.resultCard,
                },
              });
            } else {
              setFlowState(FLOW.CHECKING_REGISTRATION);
              await botReply("Result card not found. Let me check your registration status...", {}, 500);

              const regRes = await API.checkRegistration(data.studentId);
              setFlowState(FLOW.DONE);
              if (regRes.registered) {
                await botReply(
                  "You are registered, but your result card has not been uploaded yet. This has been flagged for review — your institution will be notified. Please check back later or contact your exam cell."
                );
              } else {
                await botReply(
                  "Your registration could not be confirmed. Please contact your admin or the exam cell for further assistance."
                );
              }
            }
          } else {
            setFlowState(FLOW.DONE);
            await botReply(
              `The name "${data.studentName}" does not match the records for roll number ${data.rollNumber}. Please verify and try again, or contact your admin.`
            );
          }
        } catch {
          setFlowState(FLOW.DONE);
          await botReply("Something went wrong during verification. Please try again later.");
        }
        break;
      }

      default:
        break;
    }
  }, [studentData, botReply]);

  // ─── SEND HANDLER ───

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput("");
    addMsg("user", text);

    // If we're in a verification flow, feed input to the flow engine
    if ([FLOW.ASK_COLLEGE, FLOW.ASK_ROLL, FLOW.ASK_NAME].includes(flowState)) {
      await runVerification(flowState, text);
      return;
    }

    // If done, allow restarting
    if (flowState === FLOW.DONE) {
      if (detectIntent(text)) {
        setStudentData({});
        setFlowState(FLOW.ASK_COLLEGE);
        await botReply(
          "Sure, let's look that up. I'll need to verify your identity first. Please enter your college name."
        );
        return;
      }
      await botReply(
        "If you need help finding your result card, just let me know! You can also type 'result' to start a new lookup."
      );
      return;
    }

    // IDLE — detect if user is asking about results
    if (detectIntent(text)) {
      setStudentData({});
      setFlowState(FLOW.ASK_COLLEGE);
      await botReply(
        "I can help you with that! For security, I'll need to verify your identity. Let's start — please enter your college name."
      );
    } else {
      // General response — wire to your own LLM or FAQ here
      await botReply(
        "I'm here to help with result card lookups and student record queries. If you're looking for your result card or marks, just say so and I'll guide you through the process!"
      );
    }
  }, [input, isTyping, flowState, addMsg, botReply, runVerification]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => { inputRef.current?.focus(); }, []);

  const quickActions = [
    "My result card is not found",
    "I want to check my marks",
    "Where is my marksheet?",
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "620px", fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      background: "#FFFFFF",
      borderRadius: 16, overflow: "hidden",
      border: "1px solid #E0DED8",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes msgIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes dotPulse { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(1.3);opacity:1} }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "14px 20px",
        borderBottom: "1px solid #ECEAE4",
        display: "flex", alignItems: "center", gap: 12,
        background: "#FAFAF7",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "linear-gradient(135deg, #185FA5, #1D9E75)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 16, fontWeight: 700,
        }}>S</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#2C2C2A" }}>
            Student support
          </div>
          <div style={{ fontSize: 11, color: "#8B8680", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1D9E75", display: "inline-block" }} />
            Online
          </div>
        </div>
        <button
          onClick={() => {
            setMessages([{
              id: 1, role: "assistant",
              text: "Hello! I'm your student support assistant. I can help you find your result card, check your marks, and more. How can I help you today?",
            }]);
            setFlowState(FLOW.IDLE);
            setStudentData({});
            msgId.current = 2;
          }}
          style={{
            marginLeft: "auto", background: "none",
            border: "1px solid #E0DED8", borderRadius: 8,
            padding: "6px 12px", fontSize: 12, color: "#8B8680",
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          New chat
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: "auto", padding: "18px 20px",
        display: "flex", flexDirection: "column", gap: 14,
      }}>
        {messages.map((m) => <MessageBubble key={m.id} msg={m} />)}
        {isTyping && (
          <div style={{ display: "flex", gap: 10, alignSelf: "flex-start" }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "#F1EFE8", border: "1px solid #E0DED8",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 600, color: "#5F5E5A",
            }}>AI</div>
            <div style={{
              padding: "10px 18px", borderRadius: "16px 16px 16px 4px",
              background: "#F7F6F3", border: "1px solid #ECEAE4",
            }}>
              <TypingDots />
            </div>
          </div>
        )}

        {/* Quick actions — only show at start */}
        {messages.length === 1 && flowState === FLOW.IDLE && (
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 8,
            marginTop: 6,
          }}>
            {quickActions.map((q, i) => (
              <button key={i} onClick={() => { setInput(q); setTimeout(handleSend, 50); }}
                style={{
                  padding: "8px 14px", borderRadius: 20,
                  border: "1px solid #D3D1C7",
                  background: "#FAFAF7", color: "#5F5E5A",
                  fontSize: 13, cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.target.style.background = "#F1EFE8"; e.target.style.color = "#2C2C2A"; }}
                onMouseLeave={(e) => { e.target.style.background = "#FAFAF7"; e.target.style.color = "#5F5E5A"; }}
              >{q}</button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid #ECEAE4",
        display: "flex", gap: 10, alignItems: "flex-end",
        background: "#FAFAF7",
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={
            flowState === FLOW.ASK_COLLEGE ? "Enter your college name..." :
            flowState === FLOW.ASK_ROLL ? "Enter your roll number..." :
            flowState === FLOW.ASK_NAME ? "Enter your full name..." :
            "Type your message..."
          }
          rows={1}
          style={{
            flex: 1, resize: "none",
            minHeight: 40, maxHeight: 100,
            padding: "10px 14px", fontSize: 14,
            fontFamily: "inherit",
            borderRadius: 12,
            border: "1px solid #D3D1C7",
            background: "#fff", color: "#2C2C2A",
            outline: "none", lineHeight: 1.5,
          }}
          onFocus={(e) => e.target.style.borderColor = "#185FA5"}
          onBlur={(e) => e.target.style.borderColor = "#D3D1C7"}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          style={{
            width: 40, height: 40, borderRadius: "50%",
            background: input.trim() && !isTyping ? "#185FA5" : "#E0DED8",
            border: "none", cursor: input.trim() && !isTyping ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s", flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
