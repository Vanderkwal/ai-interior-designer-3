/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import StartScreen from './components/StartScreen';
import Canvas from './components/Canvas';
import Footer from './components/Footer';
import { generateInitialDesign, applyDesignChange } from './services/geminiService';
import { getFriendlyErrorMessage } from './lib/utils';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const currentImage = history[currentHistoryIndex] ?? null;

  const handleDesignGeneration = useCallback(async (imageFile: File, prompt: string) => {
    setIsLoading(true);
    setLoadingMessage('Generating your new design...');
    setError(null);
    try {
      const generatedImage = await generateInitialDesign(imageFile, prompt);
      
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setHistory([generatedImage]);
        setCurrentHistoryIndex(0);
      };
      reader.onerror = () => {
        setError("Could not read the uploaded file.");
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to generate design'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const handleApplyChange = useCallback(async (prompt: string, message: string) => {
    if (!currentImage || isLoading) return;
    
    setIsLoading(true);
    setLoadingMessage(message);
    setError(null);

    try {
      const newImage = await applyDesignChange(currentImage, prompt);
      
      const newHistory = history.slice(0, currentHistoryIndex + 1);
      newHistory.push(newImage);

      setHistory(newHistory);
      setCurrentHistoryIndex(newHistory.length - 1);

    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to apply changes'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentImage, isLoading, history, currentHistoryIndex]);

  const handleUndo = () => {
    if (currentHistoryIndex > 0) {
      setCurrentHistoryIndex(prev => prev - 1);
    }
  };

  const handleRedo = () => {
    if (currentHistoryIndex < history.length - 1) {
      setCurrentHistoryIndex(prev => prev + 1);
    }
  };

  const handleStartOver = () => {
    setOriginalImage(null);
    setHistory([]);
    setCurrentHistoryIndex(-1);
    setIsLoading(false);
    setLoadingMessage('');
    setError(null);
  };
  
  const viewVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <div className="font-sans bg-[#f5f5f5] min-h-screen w-full">
      <AnimatePresence mode="wait">
        {!currentImage ? (
          <motion.div
            key="start-screen"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="w-full min-h-screen flex items-center justify-center p-4"
          >
            {isLoading ? (
               <div className="flex flex-col items-center justify-center text-center">
                 <Spinner />
                 <p className="text-lg font-serif text-gray-700 mt-4">{loadingMessage}</p>
               </div>
            ) : (
              <StartScreen onGenerate={handleDesignGeneration} error={error} />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="editor-screen"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <Canvas
              originalImage={originalImage!}
              currentImage={currentImage}
              history={history}
              currentHistoryIndex={currentHistoryIndex}
              onApplyChange={handleApplyChange}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onStartOver={handleStartOver}
              isLoading={isLoading}
              loadingMessage={loadingMessage}
              error={error}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
};

export default App;
