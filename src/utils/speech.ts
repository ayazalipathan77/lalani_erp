// Speech recognition utilities for Lalani ERP
import React from 'react';

// Type declarations for speech recognition APIs
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export interface SpeechRecognitionResult {
    transcript: string;
    confidence: number;
    isFinal: boolean;
}

export interface SpeechRecognitionOptions {
    lang?: string;
    continuous?: boolean;
    interimResults?: boolean;
    maxAlternatives?: number;
}

// Check if speech recognition is supported
export const isSpeechRecognitionSupported = (): boolean => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

// Create speech recognition instance
export const createSpeechRecognition = (
    options: SpeechRecognitionOptions = {}
): any => {
    if (!isSpeechRecognitionSupported()) {
        return null;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    // Set default options
    recognition.lang = options.lang || 'en-US';
    recognition.continuous = options.continuous || false;
    recognition.interimResults = options.interimResults || true;
    recognition.maxAlternatives = options.maxAlternatives || 1;

    return recognition;
};

// Start speech recognition
export const startSpeechRecognition = (
    onResult: (result: SpeechRecognitionResult) => void,
    onError?: (error: string) => void,
    onEnd?: () => void,
    options: SpeechRecognitionOptions = {}
): (() => void) | null => {
    const recognition = createSpeechRecognition(options);

    if (!recognition) {
        if (onError) {
            onError('Speech recognition is not supported in this browser');
        }
        return null;
    }

    // Handle results
    recognition.onresult = (event: any) => {
        const results = event.results;
        const lastResult = results[results.length - 1];

        if (lastResult) {
            const transcript = lastResult[0].transcript;
            const confidence = lastResult[0].confidence;
            const isFinal = lastResult.isFinal;

            onResult({
                transcript,
                confidence,
                isFinal
            });
        }
    };

    // Handle errors
    recognition.onerror = (event: any) => {
        let errorMessage = 'Speech recognition error';

        switch (event.error) {
            case 'no-speech':
                errorMessage = 'No speech was detected';
                break;
            case 'audio-capture':
                errorMessage = 'Audio capture failed';
                break;
            case 'not-allowed':
                errorMessage = 'Microphone permission denied';
                break;
            case 'network':
                errorMessage = 'Network error occurred';
                break;
            case 'service-not-allowed':
                errorMessage = 'Speech recognition service not allowed';
                break;
        }

        if (onError) {
            onError(errorMessage);
        }
    };

    // Handle end
    recognition.onend = () => {
        if (onEnd) {
            onEnd();
        }
    };

    // Start recognition
    try {
        recognition.start();
    } catch (error) {
        if (onError) {
            onError('Failed to start speech recognition');
        }
        return null;
    }

    // Return stop function
    return () => {
        recognition.stop();
    };
};

// Speech synthesis (text-to-speech)
export const speak = (
    text: string,
    options: {
        lang?: string;
        rate?: number;
        pitch?: number;
        volume?: number;
    } = {}
): void => {
    if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis is not supported in this browser');
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // Set options
    utterance.lang = options.lang || 'en-US';
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    window.speechSynthesis.speak(utterance);
};

// Get available voices
export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
    if (!('speechSynthesis' in window)) {
        return [];
    }

    return window.speechSynthesis.getVoices();
};

// Check if speech synthesis is supported
export const isSpeechSynthesisSupported = (): boolean => {
    return 'speechSynthesis' in window;
};

// Stop speech synthesis
export const stopSpeech = (): void => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
};

// Voice search hook for React components
export const useVoiceSearch = () => {
    const [isListening, setIsListening] = React.useState(false);
    const [transcript, setTranscript] = React.useState('');
    const [error, setError] = React.useState<string>('');

    const startListening = React.useCallback(() => {
        if (!isSpeechRecognitionSupported()) {
            setError('Voice search is not supported in this browser');
            return;
        }

        setError('');
        setTranscript('');
        setIsListening(true);

        const stopListening = startSpeechRecognition(
            (result) => {
                setTranscript(result.transcript);
                if (result.isFinal) {
                    setIsListening(false);
                }
            },
            (errorMsg) => {
                setError(errorMsg);
                setIsListening(false);
            },
            () => {
                setIsListening(false);
            },
            {
                lang: 'en-US',
                continuous: false,
                interimResults: true
            }
        );

        return stopListening;
    }, []);

    const stopListening = React.useCallback(() => {
        setIsListening(false);
    }, []);

    return {
        isListening,
        transcript,
        error,
        startListening,
        stopListening
    };
};