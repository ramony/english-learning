import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  SimpleGrid,
  useToast,
  Badge,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Input,
  FormControl,
  FormLabel,
  CircularProgress,
  CircularProgressLabel,
  Grid,
  useBoolean,
  Tooltip,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Tabs,
  TabList,
  Tab,
  Select,
  Tag,
  TagLabel,
  TagLeftIcon,
} from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { grades } from './data/grades';
import { wordLibrary } from './data/wordLibrary';
import { ViewIcon } from '@chakra-ui/icons';

function App() {
  const [currentWord, setCurrentWord] = useState(null);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [options, setOptions] = useState([]);
  const [streak, setStreak] = useState(0);
  const [currentCategory, setCurrentCategory] = useState('basic');
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(() => {
    return parseInt(localStorage.getItem('dailyGoal')) || 20;
  });
  const [dailyProgress, setDailyProgress] = useState(() => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem('dailyProgress');
    const progress = saved ? JSON.parse(saved) : {};
    return progress[today] || 0;
  });
  const [stats, setStats] = useState(() => {
    return JSON.parse(localStorage.getItem('learningStats')) || {
      totalAnswered: 0,
      correctAnswers: 0,
      streakRecord: 0,
    };
  });
  const [wrongWords, setWrongWords] = useState(() => {
    const saved = localStorage.getItem('wrongWords');
    return saved ? JSON.parse(saved) : [];
  });
  const [achievements, setAchievements] = useState(() => {
    return JSON.parse(localStorage.getItem('achievements')) || {
      firstWord: false,
      tenStreak: false,
      perfectDay: false,
      hundredWords: false,
      allCategories: false,
    };
  });
  const [showAchievement, setShowAchievement] = useState(null);
  const [isSoundEnabled, setIsSoundEnabled] = useBoolean(true);
  const [currentGrade, setCurrentGrade] = useState(() => {
    return localStorage.getItem('currentGrade') || 'grade1';
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isAchievementsOpen,
    onOpen: onAchievementsOpen,
    onClose: onAchievementsClose
  } = useDisclosure();

  const toast = useToast();

  // 添加调试日志
  useEffect(() => {
    console.log('当前年级:', currentGrade);
    console.log('词库:', wordLibrary);
    console.log('当前分类:', currentCategory);
    console.log('当前年级词库:', categories);
  }, [currentGrade, currentCategory]);

  // 获取当前年级的词库
  const categories = wordLibrary[currentGrade] || wordLibrary.grade1;

  const handleGradeChange = (grade) => {
    setCurrentGrade(grade);
    localStorage.setItem('currentGrade', grade);
    setCurrentWord(null);
    setScore(0);
    setStreak(0);
    toast({
      title: `已切换到${grades[grade].name}`,
      description: `难度：${grades[grade].level}`,
      status: 'info',
      duration: 2000
    });
  };

  const speakWord = (word) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const getRandomOptions = (correctAnswer, wordList) => {
    let choices = [correctAnswer];
    const availableWords = Array.isArray(wordList) ? wordList : Object.values(categories).flat();

    while (choices.length < 4) {
      const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
      if (!choices.includes(randomWord.chinese)) {
        choices.push(randomWord.chinese);
      }
    }
    return choices.sort(() => Math.random() - 0.5);
  };

  const selectRandomWord = () => {
    // 添加调试日志
    console.log('选择单词时的分类:', currentCategory);
    console.log('当前分类的单词列表:', categories[currentCategory]);

    const wordList = isReviewMode ? wrongWords : categories[currentCategory];

    // 检查词库是否为空
    if (!wordList || wordList.length === 0) {
      console.error('词库为空:', {
        isReviewMode,
        currentGrade,
        currentCategory,
        categories,
        wordList
      });

      setCurrentWord(null);
      toast({
        title: isReviewMode ? '没有需要复习的单词' : '当前类别没有单词',
        description: '请检查词库加载是否正确',
        status: 'warning',
        duration: 2000,
      });
      return;
    }

    const randomIndex = Math.floor(Math.random() * wordList.length);
    const selected = wordList[randomIndex];
    setCurrentWord(selected);

    // 获取所有可用的单词作为选项池
    const allWords = Object.values(categories).flat();
    setOptions(getRandomOptions(selected.chinese, allWords));
    setShowAnswer(false);
  };

  // 添加音效函数
  const playWrongSound = () => {
    const wrongSound = new Audio('/sounds/wrong.mp3');
    wrongSound.volume = 0.5; // 设置音量为50%
    wrongSound.play().catch(error => {
      console.error('音效播放失败:', error);
    });
  };

  // 在 App 组件内添加播放音效的函数
  const playSound = (type) => {
    if (!isSoundEnabled) return;

    const soundMap = {
      correct: '/sounds/correct.mp3',
      wrong: '/sounds/wrong.mp3',
      complete: '/sounds/complete.mp3'
    };

    const audio = new Audio(soundMap[type]);
    audio.volume = 0.5; // 设置音量为50%
    audio.play().catch(error => {
      console.error('音效播放失败:', error);
    });
  };

  const handleAnswer = (choice) => {
    if (!showAnswer) {
      setShowAnswer(true);
      const isCorrect = choice === currentWord.chinese;

      // 更新统计数据
      const newStats = {
        ...stats,
        totalAnswered: stats.totalAnswered + 1,
        correctAnswers: stats.correctAnswers + (isCorrect ? 1 : 0),
        streakRecord: Math.max(stats.streakRecord, isCorrect ? streak + 1 : streak),
      };
      setStats(newStats);
      localStorage.setItem('learningStats', JSON.stringify(newStats));

      // 更新每日进度
      const today = new Date().toDateString();
      const newProgress = dailyProgress + 1;
      setDailyProgress(newProgress);
      const savedProgress = JSON.parse(localStorage.getItem('dailyProgress') || '{}');
      savedProgress[today] = newProgress;
      localStorage.setItem('dailyProgress', JSON.stringify(savedProgress));

      if (isCorrect) {
        setScore(score + 10);
        setStreak(streak + 1);
        speakWord(currentWord.english);
        playSound('correct'); // 添加正确音效

        toast({
          title: '回答正确！',
          description: streak >= 2 ? `连续答对 ${streak + 1} 次！` : '继续加油！',
          status: 'success',
          duration: 1500,
          isClosable: true,
        });

        if (isReviewMode) {
          setWrongWords(prev => prev.filter(w => w.english !== currentWord.english));
        }
      } else {
        setStreak(0);
        playSound('wrong'); // 添加错误音效

        if (!isReviewMode && !wrongWords.find(w => w.english === currentWord.english)) {
          setWrongWords(prev => [...prev, currentWord]);
        }

        toast({
          title: '继续努力！',
          description: `正确答案是：${currentWord.chinese}`,
          status: 'error',
          duration: 2000,
          isClosable: true,
        });
      }
    }
  };

  const toggleReviewMode = () => {
    setIsReviewMode(!isReviewMode);
    setCurrentWord(null);
    setStreak(0);
  };

  const unlockAchievement = (achievementId) => {
    if (!achievements[achievementId]) {
      const newAchievements = { ...achievements, [achievementId]: true };
      setAchievements(newAchievements);
      localStorage.setItem('achievements', JSON.stringify(newAchievements));

      setShowAchievement(achievementsList[achievementId]);
      playSound('complete');

      setTimeout(() => {
        setShowAchievement(null);
      }, 3000);
    }
  };

  const achievementsList = {
    firstWord: {
      title: '初次学习',
      description: '完成第一个单词的学习',
      icon: '🎯',
    },
    tenStreak: {
      title: '完美表现',
      description: '连续答对10个单词',
      icon: '🏆',
    },
    perfectDay: {
      title: '每日达人',
      description: '完成每日学习目标',
      icon: '⭐',
    },
    hundredWords: {
      title: '词汇专家',
      description: '学习100个单词',
      icon: '📚',
    },
    allCategories: {
      title: '全能学习',
      description: '在所有分类中都答对过单词',
      icon: '🎓',
    },
  };

  // 检查成就
  useEffect(() => {
    if (stats.totalAnswered === 1) {
      unlockAchievement('firstWord');
    }
    if (streak === 10) {
      unlockAchievement('tenStreak');
    }
    if (stats.totalAnswered >= 100) {
      unlockAchievement('hundredWords');
    }
  }, [stats.totalAnswered, streak]);

  // 保存错题
  useEffect(() => {
    localStorage.setItem('wrongWords', JSON.stringify(wrongWords));
  }, [wrongWords]);

  // 在 useEffect 中添加一个检查，确保默认分类存在
  useEffect(() => {
    const currentGradeCategories = categories ? Object.keys(categories) : [];
    if (currentGradeCategories.length > 0 && !currentGradeCategories.includes(currentCategory)) {
      setCurrentCategory(currentGradeCategories[0]);
    }
  }, [currentGrade, categories]);

  const StatsModal = () => (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>学习统计</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <StatGroup w="full">
              <Stat>
                <StatLabel>总答题数</StatLabel>
                <StatNumber>{stats.totalAnswered}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>正确率</StatLabel>
                <StatNumber>
                  {stats.totalAnswered ?
                    Math.round((stats.correctAnswers / stats.totalAnswered) * 100) : 0}%
                </StatNumber>
              </Stat>
              <Stat>
                <StatLabel>最高连续</StatLabel>
                <StatNumber>{stats.streakRecord}</StatNumber>
              </Stat>
            </StatGroup>

            <Divider />

            <FormControl>
              <FormLabel>每日学习目标</FormLabel>
              <Input
                type="number"
                value={dailyGoal}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setDailyGoal(value);
                  localStorage.setItem('dailyGoal', value);
                }}
                min={1}
                max={100}
              />
            </FormControl>

            <CircularProgress
              value={(dailyProgress / dailyGoal) * 100}
              size="120px"
              color="green.400"
            >
              <CircularProgressLabel>
                {dailyProgress}/{dailyGoal}
              </CircularProgressLabel>
            </CircularProgress>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );

  const AchievementsDrawer = () => (
    <Drawer isOpen={isAchievementsOpen} onClose={onAchievementsClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>我的成就</DrawerHeader>
        <DrawerBody>
          <SimpleGrid columns={1} spacing={4}>
            {Object.entries(achievementsList).map(([id, achievement]) => (
              <Box
                key={id}
                p={4}
                borderWidth="1px"
                borderRadius="lg"
                opacity={achievements[id] ? 1 : 0.5}
                bg={achievements[id] ? 'green.50' : 'gray.50'}
              >
                <HStack>
                  <Text fontSize="2xl">{achievement.icon}</Text>
                  <Box>
                    <Text fontWeight="bold">{achievement.title}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {achievement.description}
                    </Text>
                  </Box>
                  {achievements[id] && (
                    <Badge colorScheme="green" ml="auto">
                      获得
                    </Badge>
                  )}
                </HStack>
              </Box>
            ))}
          </SimpleGrid>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );

  const getCurrentCategoryWordCount = () => {
    if (!categories || !currentCategory) return 0;
    return categories[currentCategory]?.length || 0;
  };

  return (
    <Container maxW="container.md" py={8}>
      {showAchievement && (
        <Alert
          status="success"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          borderRadius="xl"
          boxShadow="xl"
          width="auto"
          zIndex={9999}
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            {showAchievement.icon} 获得新成就！
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {showAchievement.title}
            <Text fontSize="sm" mt={1}>
              {showAchievement.description}
            </Text>
          </AlertDescription>
        </Alert>
      )}

      <VStack spacing={6}>
        <Heading>英语学习助手</Heading>

        <Select
          value={currentGrade}
          onChange={(e) => handleGradeChange(e.target.value)}
          width="200px"
          variant="filled"
        >
          {Object.entries(grades).map(([key, grade]) => (
            <option key={key} value={key}>
              {grade.name} ({grade.level})
            </option>
          ))}
        </Select>

        {!isReviewMode && (
          <HStack spacing={4} width="100%" justifyContent="center">
            <Select
              value={currentCategory}
              onChange={(e) => {
                setCurrentCategory(e.target.value);
                setCurrentWord(null);
              }}
              width="200px"
              variant="filled"
              placeholder="选择单词类型"
            >
              {Object.keys(categories).map(category => (
                <option key={category} value={category}>
                  {getCategoryLabel(category)}
                </option>
              ))}
            </Select>

            <Tag size="lg" colorScheme="blue" borderRadius="full">
              <TagLeftIcon as={ViewIcon} />
              <TagLabel>{getCurrentCategoryWordCount()} 个单词</TagLabel>
            </Tag>
          </HStack>
        )}

        {isReviewMode && (
          <Tag size="lg" colorScheme="orange" borderRadius="full">
            <TagLeftIcon as={ViewIcon} />
            <TagLabel>{wrongWords.length} 个待复习</TagLabel>
          </Tag>
        )}

        {!currentWord ? (
          <VStack spacing={4}>
            {isReviewMode && wrongWords.length === 0 ? (
              <Text fontSize="xl" color="green.500">
                🎉 太棒了！没有需要复习的单词了！
              </Text>
            ) : (
              <Button
                colorScheme="blue"
                size="lg"
                onClick={selectRandomWord}
              >
                开始{isReviewMode ? '复习' : '学习'}
              </Button>
            )}
          </VStack>
        ) : (
          <Box
            w="full"
            p={6}
            borderWidth="1px"
            borderRadius="lg"
            boxShadow="lg"
          >
            <VStack spacing={4}>
              <Text fontSize="6xl">{currentWord.image}</Text>

              <Box textAlign="center">
                <Text
                  fontSize="3xl"
                  fontWeight="bold"
                  cursor="pointer"
                  onClick={() => speakWord(currentWord.english)}
                >
                  {currentWord.english} 🔊
                </Text>
                <Text color="gray.500">{currentWord.phonetic}</Text>
              </Box>

              <SimpleGrid columns={2} spacing={4} w="full">
                {options.map((option, index) => (
                  <Button
                    key={index}
                    colorScheme={
                      showAnswer
                        ? option === currentWord.chinese
                          ? 'green'
                          : 'red'
                        : 'gray'
                    }
                    onClick={() => handleAnswer(option)}
                    isDisabled={showAnswer}
                    position="relative"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    gap={2}
                  >
                    {option}
                    {showAnswer && option === currentWord.chinese && (
                      <CheckCircleIcon color="white" />
                    )}
                  </Button>
                ))}
              </SimpleGrid>
            </VStack>
          </Box>
        )}

        {currentWord && (
          <Button
            colorScheme="blue"
            onClick={selectRandomWord}
          >
            下一个单词
          </Button>
        )}

        <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
          <CircularProgress
            value={(dailyProgress / dailyGoal) * 100}
            color="green.400"
          >
            <CircularProgressLabel>
              {dailyProgress}/{dailyGoal}
            </CircularProgressLabel>
          </CircularProgress>
          <Box>
            <Text fontSize="sm" color="gray.500">今日目标</Text>
            <Progress
              value={(dailyProgress / dailyGoal) * 100}
              colorScheme="green"
              hasStripe
            />
          </Box>
        </Grid>

        <StatsModal />
        <AchievementsDrawer />
      </VStack>
    </Container>
  );
}

// 辅助函数：获取分类标签
const getCategoryLabel = (category) => {
  const labels = {
    fruits: '水果 🍎',
    animals: '动物 🐱',
    colors: '颜色 🎨',
    numbers: '数字 🔢',
    school: '学校 📚',
    family: '家庭 👨‍👩‍👧‍👦',
    weather: '天气 ⛅',
    sports: '运动 ⚽',
    food: '食物 🍽️',
    body: '身体 👤',
    clothes: '衣服 👕',
    transport: '交通 🚗',
    nature: '自然 🌳',
    time: '时间 ⏰',
    house: '房屋 🏠',
    jobs: '职业 👨‍⚕️',
    emotions: '情绪 😊',
    actions: '动作 🏃',
    places: '地点 🏢',
    objects: '物品 📱',
  };
  return labels[category] || category;
};

export default App;