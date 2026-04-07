import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const DataContext = createContext();

const defaultSchedule = { 1: [], 2: [], 3: [], 4: [], 5: [] };

export const DataProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [allData, setAllData] = useState({});
  const [currentSemester, setCurrentSemester] = useState("114-1");
  const [semesterList, setSemesterList] = useState(["114-1"]);
  const [customPeriods, setCustomPeriods] = useState(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D']);
  const [periodConfig, setPeriodConfig] = useState({ classDur: 50, breakDur: 10, startHash: "08:10" });
  const [periodTimesConfig, setPeriodTimesConfig] = useState({});

  const [paymentMethods, setPaymentMethods] = useState([ "現金", "一卡通", "悠遊卡", "信用卡", "行動支付", "轉帳" ]);
  const [accCategories, setAccCategories] = useState({
    expense: [ "飲食", "交通", "購物", "生活用品", "網路費", "其他" ],
    income: [ "薪水", "零用錢", "獎金", "投資", "其他" ]
  });

  const [selfStudyConversionRate, setSelfStudyConversionRate] = useState(18);
  const [graduationTarget, setGraduationTarget] = useState(128);
  const [categoryTargets, setCategoryTargets] = useState({ "自由選修": 20 });
  const [userSchoolInfo, setUserSchoolInfo] = useState({ school: '', department: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadData(currentUser.uid);
      } else {
        setIsDataLoaded(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadData = async (uid) => {
    try {
      const dbKey = 'CampusKing_v3.8.0_' + uid;
      const savedData = localStorage.getItem(dbKey);
      
      if (savedData) {
        parseAndApplyData(JSON.parse(savedData));
        if (navigator.onLine) {
          syncFromCloud(uid);
        }
      } else {
        if (navigator.onLine) {
          await syncFromCloud(uid);
        } else {
          initDefaultData();
        }
      }
    } catch (e) {
      console.error(e);
      initDefaultData();
    }
  };

  const syncFromCloud = async (uid) => {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        parseAndApplyData(docSnap.data());
        const dbKey = 'CampusKing_v3.8.0_' + uid;
        localStorage.setItem(dbKey, JSON.stringify(docSnap.data()));
      } else {
        initDefaultData();
      }
    } catch (error) {
      console.error("同步失敗:", error);
    }
  };

  const parseAndApplyData = (parsed) => {
    setAllData(parsed.allData || {});
    setSemesterList(parsed.semesterList || ["114-1"]);
    setCurrentSemester(parsed.currentSemester || (parsed.semesterList ? parsed.semesterList[0] : "114-1"));
    if (parsed.customPeriods) setCustomPeriods(parsed.customPeriods);
    if (parsed.periodConfig) setPeriodConfig(parsed.periodConfig);
    if (parsed.periodTimesConfig) setPeriodTimesConfig(parsed.periodTimesConfig);
    if (parsed.paymentMethods) setPaymentMethods(parsed.paymentMethods);
    if (parsed.accCategories) setAccCategories(parsed.accCategories);
    if (parsed.selfStudyConversionRate) setSelfStudyConversionRate(parsed.selfStudyConversionRate);
    if (parsed.graduationTarget) setGraduationTarget(parsed.graduationTarget);
    if (parsed.categoryTargets) setCategoryTargets(parsed.categoryTargets);
    if (parsed.userSchoolInfo) setUserSchoolInfo(parsed.userSchoolInfo);
    
    setIsDataLoaded(true);
  };

  const initDefaultData = () => {
    setSemesterList(["114-1"]);
    setCurrentSemester("114-1");
    setAllData({
      "114-1": { 
        schedule: JSON.parse(JSON.stringify(defaultSchedule)),
        grades: [], regularExams: {}, midtermExams: {}, calendarEvents: [], accounting: [], selfStudyActivities: [],
        gradeCalcNotes: [], homeworkList: []
      }
    });
    setSelfStudyConversionRate(18);
    setGraduationTarget(128);
    setCategoryTargets({ "自由選修": 20 });
    setUserSchoolInfo({ school: '', department: '' });
    setIsDataLoaded(true);
  };

  const saveData = async (
    newAllData = allData, 
    newPeriods = customPeriods, 
    newPM = paymentMethods, 
    newCat = accCategories,
    newConversionRate = selfStudyConversionRate,
    newGradTarget = graduationTarget,
    newCatTargets = categoryTargets,
    newSchoolInfo = userSchoolInfo
  ) => {
    if (!user || !isDataLoaded) return;
    
    setAllData(newAllData);
    setCustomPeriods(newPeriods);
    setPaymentMethods(newPM);
    setAccCategories(newCat);
    setSelfStudyConversionRate(newConversionRate);
    setGraduationTarget(newGradTarget);
    setCategoryTargets(newCatTargets);
    setUserSchoolInfo(newSchoolInfo);

    const storageObj = {
      allData: newAllData,
      semesterList,
      currentSemester,
      customPeriods: newPeriods,
      periodConfig,
      periodTimesConfig,
      paymentMethods: newPM,
      accCategories: newCat,
      userSchoolInfo: newSchoolInfo,
      selfStudyConversionRate: newConversionRate,
      graduationTarget: newGradTarget,
      categoryTargets: newCatTargets
      // add other data later...
    };

    const dbKey = 'CampusKing_v3.8.0_' + user.uid;
    localStorage.setItem(dbKey, JSON.stringify(storageObj));

    try {
      storageObj.lastUpdated = serverTimestamp();
      await setDoc(doc(db, "users", user.uid), storageObj, { merge: true });
    } catch (error) {
      console.error("雲端備份失敗: ", error);
    }
  };

  const updateSemesterData = (key, newData) => {
    const newAllData = { ...allData };
    if (!newAllData[currentSemester]) newAllData[currentSemester] = {};
    newAllData[currentSemester][key] = newData;
    saveData(newAllData, customPeriods, paymentMethods, accCategories, selfStudyConversionRate, graduationTarget, categoryTargets);
  };

  const getWeeklySchedule = () => allData[currentSemester]?.schedule || {};
  const updateWeeklySchedule = (newSchedule) => updateSemesterData('schedule', newSchedule);

  const getAccountingList = () => allData[currentSemester]?.accounting || [];
  const updateAccountingList = (newList) => updateSemesterData('accounting', newList);

  const getCalendarEvents = () => allData[currentSemester]?.calendarEvents || [];
  const updateCalendarEvents = (newList) => updateSemesterData('calendarEvents', newList);

  const getSelfStudyActivities = () => allData[currentSemester]?.selfStudyActivities || [];
  const updateSelfStudyActivities = (newList) => updateSemesterData('selfStudyActivities', newList);

  // Grades & Exams & Homework
  const getGradeList = () => allData[currentSemester]?.grades || [];
  const updateGradeList = (newList) => updateSemesterData('grades', newList);

  const getRegularExams = () => allData[currentSemester]?.regularExams || {};
  const updateRegularExams = (newExams) => updateSemesterData('regularExams', newExams);

  const getMidtermExams = () => allData[currentSemester]?.midtermExams || {};
  const updateMidtermExams = (newExams) => updateSemesterData('midtermExams', newExams);

  const getGradeCalcNotes = () => allData[currentSemester]?.gradeCalcNotes || [];
  const updateGradeCalcNotes = (newList) => updateSemesterData('gradeCalcNotes', newList);

  const getHomeworkList = () => allData[currentSemester]?.homeworkList || [];
  const updateHomeworkList = (newList) => updateSemesterData('homeworkList', newList);

  const getAnniversaries = () => allData[currentSemester]?.anniversaries || [];
  const updateAnniversaries = (newList) => updateSemesterData('anniversaries', newList);

  const getLotteryList = () => allData[currentSemester]?.lottery || [];
  const updateLotteryList = (newList) => updateSemesterData('lottery', newList);

  const updateSelfStudyConversionRate = (newRate) => saveData(allData, customPeriods, paymentMethods, accCategories, newRate, graduationTarget, categoryTargets);
  const updateGraduationTarget = (newTarget) => saveData(allData, customPeriods, paymentMethods, accCategories, selfStudyConversionRate, newTarget, categoryTargets);
  const updateCategoryTargets = (newTargets) => saveData(allData, customPeriods, paymentMethods, accCategories, selfStudyConversionRate, graduationTarget, newTargets);

  return (
    <DataContext.Provider value={{
      user, isDataLoaded, currentSemester, semesterList, customPeriods, getWeeklySchedule, updateWeeklySchedule, periodConfig, periodTimesConfig, saveData,
      paymentMethods, setPaymentMethods, accCategories, setAccCategories, getAccountingList, updateAccountingList,
      getCalendarEvents, updateCalendarEvents, getSelfStudyActivities, updateSelfStudyActivities, selfStudyConversionRate, updateSelfStudyConversionRate,
      getGradeList, updateGradeList, getRegularExams, updateRegularExams, getMidtermExams, updateMidtermExams, getGradeCalcNotes, updateGradeCalcNotes,
      getHomeworkList, updateHomeworkList, getAnniversaries, updateAnniversaries, getLotteryList, updateLotteryList, graduationTarget, updateGraduationTarget, categoryTargets, updateCategoryTargets, allData, userSchoolInfo
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
