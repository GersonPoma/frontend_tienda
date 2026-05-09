import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VozService {
  private recognition: any = null;
  private resultadoSubject = new Subject<string>();
  private errorSubject = new Subject<string>();
  private escuchandoSubject = new Subject<boolean>();

  private recognitionInstance: any;

  isSupported(): boolean {
    return !!(window as any).webkitSpeechRecognition || !!(window as any).SpeechRecognition;
  }

  iniciar(idioma: string = 'es-ES'): void {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      this.errorSubject.next('Reconocimiento de voz no soportado');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = idioma;
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.resultadoSubject.next(transcript);
      this.escuchandoSubject.next(false);
    };

    this.recognition.onerror = (event: any) => {
      this.errorSubject.next(`Error: ${event.error}`);
      this.escuchandoSubject.next(false);
    };

    this.recognition.onend = () => {
      this.escuchandoSubject.next(false);
    };

    this.escuchandoSubject.next(true);
    this.recognition.start();
  }

  detener(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    this.escuchandoSubject.next(false);
  }

  get resultado$(): Observable<string> {
    return this.resultadoSubject.asObservable();
  }

  get error$(): Observable<string> {
    return this.errorSubject.asObservable();
  }

  get escuchando$(): Observable<boolean> {
    return this.escuchandoSubject.asObservable();
  }
}
