class PCM16Worklet extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0][0];
    if (!input) return true;

    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < input.length; i++) {
      let s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s * 32767, true);
    }

    this.port.postMessage(buffer);
    return true;
  }
}

registerProcessor("pcm16-worklet-processor", PCM16Worklet);