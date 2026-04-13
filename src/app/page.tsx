"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Aperture, Database, Zap, DatabaseZap, Network, CheckCircle, Mic, MicOff, Settings, Type, ZoomIn, ZoomOut } from "lucide-react";
import { useRef, useState, useEffect } from "react";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const backgroundTextX1 = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);
  const backgroundTextX2 = useTransform(scrollYProgress, [0, 1], ["-50%", "0%"]);

  // Application State
  const [flowState, setFlowState] = useState<'connect' | 'query'>('connect');
  
  // Accessibility State
  const [isDyslexic, setIsDyslexic] = useState(false);
  const [fontSize, setFontSize] = useState(1);
  const [showA11y, setShowA11y] = useState(false);

  // Connection State
  const [dbType, setDbType] = useState<'mysql' | 'mongodb' | 'sqlite'>('mysql');
  const [dbHost, setDbHost] = useState("");
  const [dbPort, setDbPort] = useState("");
  const [dbUser, setDbUser] = useState("");
  const [dbPass, setDbPass] = useState("");
  const [dbName, setDbName] = useState("");
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [schemaString, setSchemaString] = useState<string | null>(null);
  const [connError, setConnError] = useState("");

  // Query State
  const [query, setQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSql, setGeneratedSql] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    // Instantiate fresh on every click to avoid complex lifecycle context crashes
    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Safe mode for localhost
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalT = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalT += event.results[i][0].transcript;
        }
      }
      if (finalT.trim()) {
        setQuery((prev) => prev ? prev + " " + finalT.trim() : finalT.trim());
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    try {
      recognition.start();
      setIsListening(true);
      recognitionRef.current = recognition;
    } catch (e) {
      setIsListening(false);
    }
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      startListening();
    }
  };

  const handleConnect = async (useDemo: boolean) => {
    setConnError("");
    if (useDemo) {
      setDbType('sqlite');
      setFlowState('query');
      setSchemaString(null);
      return;
    }

    if (!dbHost || !dbUser || !dbName) {
      setConnError("Host, User, and Database Name are required.");
      return;
    }

    setIsConnecting(true);
    try {
      const res = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbType, host: dbHost, port: dbPort, user: dbUser, password: dbPass, database: dbName })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setSchemaString(data.schemaString);
      setFlowState('query');
    } catch (e: any) {
      setConnError(e.message);
    } finally {
       setIsConnecting(false);
    }
  };

  const getCredentialsObj = () => ({ host: dbHost, port: dbPort, user: dbUser, password: dbPass, database: dbName });

  const handleGenerate = async () => {
    if (!query) return;
    setIsGenerating(true);
    setGeneratedSql(null);
    setResults(null);
    setErrorMsg("");

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nlQuery: query, dbType, schemaString })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGeneratedSql(data.generatedSql);
    } catch (err: any) {
      setErrorMsg("Connection to AI failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExecute = async () => {
    if (!generatedSql) return;
    setIsExecuting(true);
    setErrorMsg("");

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executeSql: generatedSql, dbType, credentials: getCredentialsObj() })
      });
      const data = await res.json();
      if (data.executionError) throw new Error(data.executionError);
      setResults(data.results);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <main ref={containerRef} className={isDyslexic ? "dyslexic-mode" : ""} style={{ fontFamily: "var(--font-inter), sans-serif", width: "100%", position: "relative", overflowX: "hidden", paddingBottom: "100px", fontSize: `${fontSize}rem` }}>
      
      <div className="dark-vignette"></div>

      <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: -2, pointerEvents: "none", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "10vh 0", opacity: 0.03, overflow: "hidden" }}>
        <motion.div style={{ x: backgroundTextX1, whiteSpace: "nowrap", fontSize: "25vw", fontWeight: 900, color: "white", lineHeight: 0.8 }}>LEGACYLENS LEGACYLENS LEGACYLENS</motion.div>
        <motion.div style={{ x: backgroundTextX2, whiteSpace: "nowrap", fontSize: "25vw", fontWeight: 900, color: "var(--accent-color)", lineHeight: 0.8 }}>DATABASE AI DATABASE AI</motion.div>
      </div>

      <nav style={{ padding: "20px 0", position: "fixed", width: "100%", zIndex: 50, backdropFilter: "blur(10px)", background: "rgba(3, 4, 11, 0.5)", borderBottom: "1px solid var(--glass-border)" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img src="/logo.png" alt="LegacyLens Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
            <span className="logo-gradient" style={{ fontSize: "1.6rem", fontWeight: "bold" }}>LegacyLens</span>
          </div>
          
          <div style={{ display: "flex", gap: "10px", alignItems: "center", position: "relative" }}>
            <button onClick={() => setShowA11y(!showA11y)} style={{ background: "transparent", border: "1px solid var(--glass-border)", borderRadius: "50%", padding: "10px", color: "white", cursor: "pointer" }} title="Accessibility Menu">
              <Settings size={20} />
            </button>

            {showA11y && (
              <div className="glass-card" style={{ position: "absolute", top: "50px", right: "0", minWidth: "220px", display: "flex", flexDirection: "column", gap: "15px", zIndex: 100, padding: "1.5rem" }}>
                <div style={{ fontSize: "0.9em", color: "var(--text-secondary)", fontWeight: "bold", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px" }}>Accessibility Settings</div>
                
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Type size={16}/> Dyslexia Font</div>
                  <input type="checkbox" checked={isDyslexic} onChange={(e) => setIsDyslexic(e.target.checked)} style={{ cursor: "pointer", width: "18px", height: "18px" }} />
                </div>
                
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><ZoomIn size={16}/> Text Size</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => setFontSize(Math.max(0.8, fontSize - 0.2))} style={{ background: "var(--glass-border)", color: "white", border: "none", width: "28px", height: "28px", borderRadius: "14px", cursor: "pointer" }}><ZoomOut size={14}/></button>
                    <button onClick={() => setFontSize(Math.min(1.8, fontSize + 0.2))} style={{ background: "var(--glass-border)", color: "white", border: "none", width: "28px", height: "28px", borderRadius: "14px", cursor: "pointer" }}><ZoomIn size={14}/></button>
                  </div>
                </div>
              </div>
            )}
            
            <button className="btn-primary" onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>Try Engine</button>
          </div>
        </div>
      </nav>

      <section className="section" style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative" }}>
        <div className="container" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: "80px", zIndex: 10 }}>
          <motion.div className="font-outfit" initial={{ opacity: 0, scale: 0.8, rotate: -5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.8, type: "spring" }} style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.3)", color: "var(--accent-color)", padding: "10px 24px", borderRadius: "30px", marginBottom: "32px", fontSize: "1.05em", fontWeight: 600 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} style={{ display: "flex" }}>
               <Aperture size={18} />
            </motion.div>
            Welcome to LegacyLens AI 2.0
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} style={{ fontSize: "5em", fontWeight: 800, lineHeight: 1.1, marginBottom: "24px", letterSpacing: "-2px" }}>
            Bridge the gap between<br />
            <span className="gradient-text-accent">English and SQL.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.4 }} style={{ fontSize: "1.4em", color: "var(--text-secondary)", maxWidth: "700px", marginBottom: "50px", lineHeight: 1.6 }}>
            Connect to any MySQL or MongoDB database securely. Speak or type your questions, verify the generated code effortlessly, and manage your infrastructure intuitively.
          </motion.p>
        </div>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "80vw", height: "80vw", maxWidth: "800px", maxHeight: "800px", background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)", opacity: 0.5, zIndex: -1, pointerEvents: "none" }}></div>
      </section>

      <section className="section" id="engine-section" style={{ minHeight: "100vh", position: "relative", zIndex: 10 }}>
        <div className="container">
          <AnimatePresence mode="wait">
            
            {/* CONNECTION STATE */}
            {flowState === 'connect' && (
              <motion.div key="connect-flow" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="glass-card" style={{ maxWidth: "600px", margin: "0 auto" }}>
                <div style={{ display: "flex", gap: "15px", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "20px", marginBottom: "20px" }}>
                  <Network color="var(--accent-color)" size={24} />
                  <div style={{ fontFamily: "monospace", color: "white", fontWeight: 600, fontSize: "1.2em" }}>Step 1: Link Your Database</div>
                </div>

                <div className="mobile-col" style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                  <button onClick={() => setDbType('mysql')} className={dbType === 'mysql' ? "btn-primary" : "btn-outline"} style={{ flex: 1 }}>MySQL</button>
                  <button onClick={() => setDbType('mongodb')} className={dbType === 'mongodb' ? "btn-primary" : "btn-outline"} style={{ flex: 1 }}>MongoDB</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                  <input placeholder="Host (e.g. 10.0.0.12 or url)" className="form-input" value={dbHost} onChange={e=>setDbHost(e.target.value)} />
                  <div className="mobile-col" style={{ display: "flex", gap: "12px" }}>
                     <input placeholder="Port (3306 or 27017)" className="form-input" value={dbPort} onChange={e=>setDbPort(e.target.value)} style={{ flex: 1 }} />
                     <input placeholder="Database Name" className="form-input" value={dbName} onChange={e=>setDbName(e.target.value)} style={{ flex: 2 }} />
                  </div>
                  <div className="mobile-col" style={{ display: "flex", gap: "12px" }}>
                     <input placeholder="Username" className="form-input" value={dbUser} onChange={e=>setDbUser(e.target.value)} style={{ flex: 1 }} />
                     <input placeholder="Password" type="password" className="form-input" value={dbPass} onChange={e=>setDbPass(e.target.value)} style={{ flex: 1 }} />
                  </div>
                </div>

                {connError && <div style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.3)", marginBottom: "20px" }}>{connError}</div>}

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <button onClick={() => handleConnect(false)} disabled={isConnecting} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                    {isConnecting ? "Authenticating..." : `Connect Serverless ${dbType.toUpperCase()}`}
                  </button>
                  <div style={{ textAlign: "center", color: "var(--text-secondary)", margin: "8px 0" }}>— OR —</div>
                  <button onClick={() => handleConnect(true)} className="btn-outline" style={{ width: "100%", justifyContent: "center" }}>
                    Skip to Demo (Pre-seeded DB)
                  </button>
                </div>
              </motion.div>
            )}

            {/* QUERY STATE */}
            {flowState === 'query' && (
              <motion.div key="query-flow" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="glass-card" style={{ maxWidth: "900px", margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "20px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                    <DatabaseZap color="var(--accent-color)" size={24} />
                    <div className="mobile-text-sm" style={{ fontFamily: "monospace", color: "white", fontWeight: 600, fontSize: "1.2em" }}>
                      user@{dbType === 'sqlite' ? 'demo_db' : dbName}:~$  <span style={{color: "var(--accent-color)", fontSize: "0.8em", marginLeft: "8px"}}>({dbType.toUpperCase()})</span>
                    </div>
                  </div>
                  <button onClick={() => setFlowState('connect')} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", textDecoration: "underline" }}>Disconnect</button>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <label style={{ color: "var(--text-secondary)", fontSize: "0.9em", fontWeight: 600, marginBottom: "8px", display: "block" }}>Enter your conversational prompt (Voice or Text)</label>
                    <div className="mobile-col" style={{ display: "flex", gap: "12px", position: "relative" }}>
                      
                      <div style={{ display: "flex", flex: 1, position: "relative" }}>
                         <input 
                           value={query} onChange={e => setQuery(e.target.value)}
                           placeholder={isListening ? "Listening..." : "e.g., delete user id 7"}
                           className="form-input" style={{ width: "100%", padding: "16px", paddingRight: "50px", fontSize: "1.1em" }} disabled={isGenerating || isExecuting}
                         />
                         <button 
                            onClick={toggleListen}
                            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: isListening ? "var(--accent-color)" : "transparent", color: isListening ? "black" : "var(--text-secondary)", border: "none", padding: "8px", borderRadius: "50%", cursor: "pointer", transition: "all 0.3s" }}
                            title={isListening ? "Stop listening" : "Start speaking"}
                         >
                            {isListening ? <Mic size={20} /> : <MicOff size={20} />}
                         </button>
                      </div>

                      <button onClick={handleGenerate} disabled={!query || isGenerating} className="btn-primary" style={{ padding: "0 24px" }}>
                        {isGenerating ? "Analyzing..." : "Generate Query"}
                      </button>
                    </div>
                  </div>

                  {errorMsg && <div style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.3)" }}>{errorMsg}</div>}

                  {generatedSql && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                      <label style={{ color: "var(--text-secondary)", fontSize: "0.9em", fontWeight: 600, marginBottom: "8px", display: "block", marginTop: "16px" }}>Verify AI Routine</label>
                      <div style={{ padding: "20px", background: "#0f172a", borderRadius: "8px", border: "1px solid rgba(56, 189, 248, 0.5)", boxShadow: "0 0 30px rgba(56, 189, 248, 0.1)" }}>
                        <pre style={{ margin: 0, fontFamily: "monospace", color: "#38bdf8", overflowX: "auto", fontSize: "1em", whiteSpace: "pre-wrap" }}>
                          {generatedSql}
                        </pre>
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                        <button onClick={handleExecute} disabled={isExecuting} className="btn-primary" style={{ background: "#22c55e", boxShadow: "0 0 15px rgba(34, 197, 94, 0.5)", color: "white" }}>
                          {isExecuting ? "Executing..." : <><CheckCircle size={18}/> Execute Securely</>}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {results && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginTop: "16px" }}>
                      <label style={{ color: "var(--text-secondary)", fontSize: "0.9em", fontWeight: 600, marginBottom: "8px", display: "block" }}>Execution Results</label>
                      <div style={{ overflowX: "auto", background: "rgba(0,0,0,0.5)", border: "1px solid var(--glass-border)", borderRadius: "8px" }}>
                        {results.length > 0 ? (
                          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.95em" }}>
                            <thead>
                              <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                                {Object.keys(results[0]).map(k => (
                                  <th key={k} style={{ padding: "12px", borderBottom: "1px solid var(--glass-border)", color: "var(--accent-color)" }}>{k}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {results.map((row, i) => (
                                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                  {Object.values(row).map((val: any, j) => (
                                    <td key={j} style={{ padding: "12px", color: "var(--text-secondary)", minWidth: "100px" }}>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div style={{ padding: "20px", color: "var(--text-secondary)" }}>Query executed successfully. (0 rows returned or operation was an update/delete)</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* MIT Copyright Footer */}
      <footer style={{ textAlign: "center", padding: "40px 0 20px", borderTop: "1px solid var(--glass-border)", marginTop: "40px" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85em", letterSpacing: "0.05em" }}>
          © {new Date().getFullYear()} Sautrik Roy &mdash; Licensed under the MIT License. All rights reserved.
        </p>
      </footer>

    </main>
  );
}
