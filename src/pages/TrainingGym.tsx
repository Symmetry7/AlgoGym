import { useState, useEffect } from "react";
import { problemStore } from "@/lib/problem-store";
import { trainingLevels } from "@/lib/training-levels";
import { Problem } from "@/lib/types";
import { isProblemSolved } from "@/lib/utils";
import { checkLeetCodeSubmission, checkCodeforcesSubmission, getProblemIdentifier } from "@/lib/user-api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProblemCard } from "@/components/problem/ProblemCard";
import { Dices, Zap, Timer, Play, Pause, StopCircle, Eye, EyeOff, ExternalLink, Info, Code2, Target, BookOpen, Sparkles, CheckCircle, RefreshCw, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import usePersistentState from "../hooks/usePersistentState";
import { Textarea } from "@/components/ui/textarea";

function getRandomElement<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

const TOTAL_TIME = 2 * 60 * 60; // 2 hours in seconds

// Corrected LeetCode training levels based on the image
const leetcodeTrainingLevels = [
  { level: 1, questions: ["Easy", "Easy", "Easy", "Easy"], text: "Q1, Q1, Q1, Q1" },
  { level: 2, questions: ["Easy", "Easy", "Medium", "Medium"], text: "Q1, Q1, Q2, Q2" },
  { level: 3, questions: ["Easy", "Medium", "Medium", "Medium"], text: "Q1, Q2, Q2, Q2" },
  { level: 4, questions: ["Easy", "Medium", "Medium", "Hard"], text: "Q1, Q2, Q2, Q3" },
  { level: 5, questions: ["Easy", "Medium", "Hard", "Hard"], text: "Q1, Q2, Q3, Q4" },
  { level: 6, questions: ["Easy", "Medium", "Hard", "Hard"], text: "Q1, Q2, Q3, Q4" },
  { level: 7, questions: ["Medium", "Medium", "Hard", "Hard"], text: "Q2, Q2, Q3, Q4" },
  { level: 8, questions: ["Hard", "Hard", "Hard", "Hard"], text: "Q3, Q3, Q4, Q4" },
  { level: 9, questions: ["Hard", "Hard", "Hard", "Hard"], text: "Q3, Q4, Q4, Q4" },
  { level: 10, questions: ["Hard", "Hard", "Hard", "Hard"], text: "Q4, Q4, Q4, Q4" },
];

export function TrainingGymPage() {
  const [platform, setPlatform] = usePersistentState<'codeforces' | 'leetcode'>("trainingPlatform", 'codeforces');
  const [level, setLevel] = usePersistentState<number>("trainingLevel", 1);
  const [generatedProblems, setGeneratedProblems] = usePersistentState<Problem[]>("trainingProblems", []);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [timeRemaining, setTimeRemaining] = usePersistentState<number>("trainingTimeRemaining", TOTAL_TIME);
  const [isTimerRunning, setIsTimerRunning] = usePersistentState<boolean>("trainingTimerRunning", false);
  const [isTimerPaused, setIsTimerPaused] = usePersistentState<boolean>("trainingTimerPaused", false);
  const [solvedProblems, setSolvedProblems] = usePersistentState<Set<string>>("trainingSolvedProblems", new Set());
  const [score, setScore] = usePersistentState<number>("trainingScore", 0);
  const [isCheckingSubmission, setIsCheckingSubmission] = useState<string | null>(null);
  const [leetcodeHandle, setLeetcodeHandle] = usePersistentState<string>("lcHandle", "");
  const [codeforcesHandle, setCodeforcesHandle] = usePersistentState<string>("cfHandle", "");
  const [timerHours, setTimerHours] = useState(2);
  const [timerMinutes, setTimerMinutes] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && !isTimerPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        const newTime = (typeof timeRemaining === 'number' ? timeRemaining : TOTAL_TIME) - 1;
        setTimeRemaining(newTime);
        localStorage.setItem("trainingTimeRemaining", newTime.toString());
      }, 1000);
    } else if (timeRemaining === 0) {
      setIsTimerRunning(false);
      toast.info("Time's up! The training session has ended.");
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, isTimerPaused, timeRemaining, setIsTimerRunning, setTimeRemaining]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getTotalSeconds = () => timerHours * 3600 + timerMinutes * 60;

  const handleGenerateProblems = () => {
    setIsLoading(true);
    setGeneratedProblems([]);
    const allProblems = problemStore.getState().problems;
    const newProblems: Problem[] = [];
    const usedProblemIds = new Set<string>();
    if (platform === 'codeforces') {
      const selectedLevelData = trainingLevels.find((l) => l.level === level);
      if (!selectedLevelData) {
        toast.error("Invalid level selected.");
        setIsLoading(false);
        return;
      }
      const cfProblems = allProblems
        .filter((p) => p.platform === "codeforces" && p.rating)
        .sort((a, b) => {
          const contestIdA = typeof a.contestId === 'number' ? a.contestId : parseInt(a.contestId as string) || 0;
          const contestIdB = typeof b.contestId === 'number' ? b.contestId : parseInt(b.contestId as string) || 0;
          return contestIdB - contestIdA;
        });
      const freshProblems = cfProblems.filter(p => {
        const contestId = typeof p.contestId === 'number' ? p.contestId : parseInt(p.contestId as string) || 0;
        return contestId >= 1650;
      });
      const targetRatings = [selectedLevelData.p1, selectedLevelData.p2, selectedLevelData.p3, selectedLevelData.p4];
      for (const rating of targetRatings) {
        let potentialProblems = freshProblems.filter((p) => !usedProblemIds.has(p.id) && p.rating === rating);
        if (potentialProblems.length === 0) {
          potentialProblems = freshProblems.filter((p) => !usedProblemIds.has(p.id) && p.rating && Math.abs(p.rating - rating) <= 50);
        }
        if (potentialProblems.length === 0) {
          potentialProblems = cfProblems.filter((p) => !usedProblemIds.has(p.id) && p.rating === rating);
        }
        if (potentialProblems.length === 0) {
          potentialProblems = cfProblems.filter((p) => !usedProblemIds.has(p.id) && p.rating && Math.abs(p.rating - rating) <= 50);
        }
        const randomProblem = getRandomElement(potentialProblems);
        if (randomProblem) {
          newProblems.push(randomProblem);
          usedProblemIds.add(randomProblem.id);
        }
      }
    } else {
      const selectedLevelData = leetcodeTrainingLevels.find((l) => l.level === level);
      if (!selectedLevelData) {
        toast.error("Invalid level selected.");
        setIsLoading(false);
        return;
      }
      const lcProblems = allProblems.filter((p) => p.platform === "leetcode");
      for (const difficulty of selectedLevelData.questions) {
        const potentialProblems = lcProblems.filter((p) => !usedProblemIds.has(p.id) && p.difficulty === difficulty);
        const randomProblem = getRandomElement(potentialProblems);
        if (randomProblem) {
          newProblems.push(randomProblem);
          usedProblemIds.add(randomProblem.id);
        }
      }
    }
    setGeneratedProblems(newProblems);
    setSolvedProblems(new Set());
    setScore(0);
    setIsLoading(false);
    setShowDetails(false);
    setTimeRemaining(getTotalSeconds());
    setIsTimerRunning(true);
    setIsTimerPaused(false);
    localStorage.setItem("trainingProblems", JSON.stringify(newProblems));
    localStorage.setItem("trainingSolvedProblems", JSON.stringify([]));
    localStorage.setItem("trainingScore", "0");
    localStorage.setItem("trainingTimeRemaining", getTotalSeconds().toString());
    localStorage.setItem("trainingTimerRunning", "true");
    localStorage.setItem("trainingTimerPaused", "false");
    if (newProblems.length > 0) {
      const platformText = platform === "codeforces" ? "Codeforces (fresh contests after 2021)" : "LeetCode";
      toast.success(`Generated a fresh set of ${newProblems.length} problems for ${platformText} Level ${level}! Timer started.`);
    }
  };

  const handleTimerToggle = () => {
    if (generatedProblems.length === 0) {
        toast.error("Generate a problem set first to start the timer.");
        return;
    }
    setIsTimerPaused(!isTimerPaused);
    toast.info(isTimerPaused ? "Timer resumed." : "Timer paused.");
  };

  const handleTimerStop = () => {
    setIsTimerRunning(false);
    setTimeRemaining(TOTAL_TIME);
    setGeneratedProblems([]);
    setSolvedProblems(new Set());
    setScore(0);
    toast.warning("Training session stopped and reset.");
  };

  const handleSolveProblem = async (problem: Problem) => {
    if (solvedProblems.has(problem.id)) {
      toast.info("This problem has already been marked as solved!");
      return;
    }

    const currentHandle = problem.platform === "leetcode" ? leetcodeHandle : codeforcesHandle;
    if (!currentHandle) {
      toast.error(`Please enter your ${problem.platform === "leetcode" ? "LeetCode username" : "Codeforces handle"} to verify solutions.`);
      return;
    }

    setIsCheckingSubmission(problem.id);

    try {
      let isSolved = false;
      const identifier = getProblemIdentifier(problem);

      console.log(`Checking submission for problem:`, {
        platform: problem.platform,
        title: problem.title,
        identifier: identifier,
        handle: currentHandle
      });

      if (problem.platform === "leetcode" && identifier.titleSlug) {
        isSolved = await checkLeetCodeSubmission(identifier.titleSlug, currentHandle);
      } else if (problem.platform === "codeforces" && identifier.contestId && identifier.problemIndex) {
        isSolved = await checkCodeforcesSubmission(identifier.contestId, identifier.problemIndex, currentHandle);
      } else {
        console.error("Could not extract problem identifier:", identifier);
        toast.error(`Unable to identify problem details for ${problem.title}. Please try again.`);
        return;
      }

      if (isSolved) {
        setSolvedProblems(new Set([...solvedProblems, problem.id]));
        setScore(0);
        toast.success(`🎉 Problem solved! +100 points! Total: ${score + 100}/400`);
        
        // Check if all problems are solved
        if (solvedProblems.size + 1 === generatedProblems.length) {
          toast.success("🏆 Congratulations! You've solved all problems in this set!");
        }
      } else {
        const timeWindow = problem.platform === "leetcode" ? "24 hours" : "24 hours";
        toast.error(`No recent successful submission found for this problem within the last ${timeWindow}. Make sure you've solved it recently and your handle is correct!`);
      }
    } catch (error) {
      console.error("Error checking submission:", error);
      toast.error("Error checking submission. Please check your internet connection and try again.");
    } finally {
      setIsCheckingSubmission(null);
    }
  };

  const renderProblemDetails = (problem: Problem) => {
    if (!showDetails) return null;
    
    return (
      <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Problem Details</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">
              {platform === "codeforces" ? "Rating: " : "Difficulty: "}
            </span>
            <Badge variant="secondary" className="ml-1">
              {platform === "codeforces" ? (problem.rating || "N/A") : (problem.difficulty || "N/A")}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Solved: </span>
            <span className="font-medium">
              {problem.solvedCount ? problem.solvedCount.toLocaleString() : "N/A"}
            </span>
          </div>
          <div className="sm:col-span-1">
            <span className="text-muted-foreground">Contest: </span>
            <span className="font-medium text-xs">
              {problem.contestName || problem.contestType || "N/A"}
            </span>
          </div>
        </div>
        
        {/* Tags Section */}
        {problem.tags && problem.tags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Topics:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {problem.tags.map((tag, index) => (
                <Badge
                  key={`${problem.id}-detail-tag-${index}-${tag}`}
                  variant="outline"
                  className="text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Solve Button */}
        <div className="pt-3 border-t">
          {solvedProblems.has(problem.id) ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Solved! +100 points</span>
            </div>
          ) : (
            <Button
              onClick={() => handleSolveProblem(problem)}
              disabled={isCheckingSubmission === problem.id}
              className="w-full"
              size="sm"
            >
              {isCheckingSubmission === problem.id ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Solved (+100 pts)
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  };

  const getCurrentLevels = () => {
    return platform === "codeforces" ? trainingLevels : leetcodeTrainingLevels;
  };

  // Remove all Tabs and tab logic. Render a single panel UI as in the screenshot.
  return (
    <Layout>
      <div className="w-full max-w-6xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Session Setup */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Start a New Session</CardTitle>
              <CardDescription>Choose your platform and difficulty level, then generate your problem set.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 1. Select Platform */}
              <div>
                <div className="font-semibold mb-2">1. Select Platform</div>
                <div className="flex gap-2">
                  <Button variant={platform === 'codeforces' ? 'default' : 'outline'} onClick={() => setPlatform('codeforces')}><Zap className="h-4 w-4 mr-1" /> Codeforces</Button>
                  <Button variant={platform === 'leetcode' ? 'default' : 'outline'} onClick={() => setPlatform('leetcode')}><Target className="h-4 w-4 mr-1" /> LeetCode</Button>
                </div>
              </div>
              {/* 2. Select Level */}
              <div>
                <div className="font-semibold mb-2">2. Select Level</div>
                <div className="flex gap-2 items-center">
                  <Select value={level.toString()} onValueChange={v => setLevel(Number(v))}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(platform === 'codeforces' ? trainingLevels : leetcodeTrainingLevels).map(l => (
                        <SelectItem key={l.level} value={l.level.toString()}>{`Level ${l.level}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">View Levels</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Level Details</DialogTitle>
                        <DialogDescription>
                          {platform === 'codeforces' ? (
                            <ul className="list-disc ml-6 mt-2">
                              {trainingLevels.map(l => (
                                <li key={l.level}>{`Level ${l.level}: ${l.p1}, ${l.p2}, ${l.p3}, ${l.p4}`}</li>
                              ))}
                            </ul>
                          ) : (
                            <ul className="list-disc ml-6 mt-2">
                              {leetcodeTrainingLevels.map(l => (
                                <li key={l.level}>{`Level ${l.level}: ${l.text}`}</li>
                              ))}
                            </ul>
                          )}
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              {/* 3. Enter Handles */}
              <div>
                <div className="font-semibold mb-2">3. Enter Your Handles (Optional)</div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Your LeetCode username"
                    value={leetcodeHandle}
                    onChange={e => setLeetcodeHandle(e.target.value)}
                    className="w-1/2"
                  />
                  <Input
                    placeholder="Your Codeforces handle"
                    value={codeforcesHandle}
                    onChange={e => setCodeforcesHandle(e.target.value)}
                    className="w-1/2"
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">Add your handles to verify solved problems and earn points</div>
              </div>
              {/* 4. Start Training */}
              <div>
                <div className="font-semibold mb-2">4. Start Training</div>
                <Button onClick={handleGenerateProblems} disabled={isLoading} className="w-full">
                  {isLoading ? 'Generating...' : 'Generate & Start Timer'}
                </Button>
              </div>
            </CardContent>
          </Card>
          {/* Generated Problems List */}
          {generatedProblems.length > 0 && (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Generated Problems</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedProblems.map(problem => (
                      <ProblemCard key={problem.id} problem={problem} isSolved={solvedProblems.has(problem.id)} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        {/* Right: Session Timer */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Session Timer</CardTitle>
              <CardDescription>A 2-hour timer for your focused practice session.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="text-5xl font-mono mb-2">{formatTime(timeRemaining)}</div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsTimerPaused(!isTimerPaused)} disabled={!isTimerRunning}>
                  {isTimerPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button variant="destructive" onClick={() => { setIsTimerRunning(false); setTimeRemaining(TOTAL_TIME); setGeneratedProblems([]); setSolvedProblems(new Set()); setScore(0); localStorage.setItem("trainingProblems", JSON.stringify([])); localStorage.setItem("trainingSolvedProblems", JSON.stringify([])); localStorage.setItem("trainingScore", "0"); localStorage.setItem("trainingTimeRemaining", TOTAL_TIME.toString()); localStorage.setItem("trainingTimerRunning", "false"); localStorage.setItem("trainingTimerPaused", "false"); }} disabled={!isTimerRunning}>
                  Stop & Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export default TrainingGymPage; 

