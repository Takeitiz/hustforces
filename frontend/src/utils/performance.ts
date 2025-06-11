export interface PerformanceMetric {
    name: string
    duration: number
    timestamp: number
    metadata?: Record<string, any>
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = []
    private timers: Map<string, number> = new Map()

    startTimer(name: string): void {
        this.timers.set(name, Date.now())
    }

    endTimer(name: string, metadata?: Record<string, any>): number {
        const startTime = this.timers.get(name)
        if (!startTime) {
            console.warn(`[Performance] No timer found for ${name}`)
            return 0
        }

        const duration = Date.now() - startTime
        this.timers.delete(name)

        const metric: PerformanceMetric = {
            name,
            duration,
            timestamp: Date.now(),
            metadata
        }

        this.metrics.push(metric)
        console.log(`[Performance] ${name} took ${duration}ms`, metadata)

        // Send to analytics if available
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'timing_complete', {
                name,
                value: duration,
                event_category: 'code_room',
                ...metadata
            })
        }

        return duration
    }

    getMetrics(): PerformanceMetric[] {
        return [...this.metrics]
    }

    clearMetrics(): void {
        this.metrics = []
        this.timers.clear()
    }
}

export const performanceMonitor = new PerformanceMonitor()

export function measureConnectionTime(startTime: number): void {
    const duration = Date.now() - startTime
    console.log(`[Performance] WebSocket connection took ${duration}ms`)
}