// Minimal shape of the Web Speech API's SpeechRecognition — not in lib.dom,
// and only Chrome/Edge implement it (as the vendor-prefixed constructor).
interface SpeechRecognitionLike extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	start(): void;
	stop(): void;
	onresult:
		| ((event: {
				results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }>>;
		  }) => void)
		| null;
	onend: (() => void) | null;
	onerror: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
	if (typeof window === 'undefined') return null;
	const w = window as unknown as {
		SpeechRecognition?: SpeechRecognitionCtor;
		webkitSpeechRecognition?: SpeechRecognitionCtor;
	};
	return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Live captions via the browser's built-in speech recognition, posted to
 * the call's transcript as the person talks. This is a deliberate stand-in
 * for real STT: the "real" pipeline for the AI agent's own turns runs
 * inside the separate agent worker (OpenAI Realtime API does STT+TTS
 * together there), but there's nothing server-side transcribing the two
 * *human* callers, and standing up a separate Whisper pipeline for that
 * felt like the wrong thing to spend the budget on for a first pass —
 * Chrome/Edge ship this for free and it's good enough to feed the
 * copilot's context.
 */
export function createCaptions(onEntry: (text: string, lowConfidence: boolean) => void) {
	const Ctor = getCtor();
	let recognition: SpeechRecognitionLike | null = null;
	let active = $state(false);

	function start() {
		if (!Ctor || active) return;
		recognition = new Ctor();
		recognition.continuous = true;
		recognition.interimResults = false;
		recognition.lang = 'en-US';
		recognition.onresult = (event) => {
			const last = event.results[event.results.length - 1]?.[0];
			const text = last?.transcript?.trim();
			if (text) onEntry(text, (last.confidence ?? 1) < 0.7);
		};
		recognition.onend = () => {
			if (active) recognition?.start();
		};
		recognition.onerror = () => {
			active = false;
		};
		recognition.start();
		active = true;
	}

	function stop() {
		active = false;
		recognition?.stop();
		recognition = null;
	}

	return {
		get supported() {
			return Ctor !== null;
		},
		get active() {
			return active;
		},
		start,
		stop
	};
}
