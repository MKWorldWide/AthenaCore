import { TaskMatrix, TaskDefinition, TaskContext } from '../taskmatrix';

describe('TaskMatrix', () => {
  let kernel: any;
  let memory: any;
  let llm: any;
  let trading: any;
  let ops: TaskMatrix;

  beforeEach(() => {
    kernel = { heartbeat: jest.fn(), selfHeal: jest.fn() };
    memory = { set: jest.fn(), get: jest.fn() };
    llm = { generate: jest.fn(async () => ({ content: 'ok' })) };
    trading = { getBalance: jest.fn(async () => 1000), placeOrder: jest.fn() };
    ops = new TaskMatrix({ kernel, memory, llm, trading });
  });

  afterEach(() => {
    ops.stop();
  });

  it('registers and lists tasks', () => {
    ops.registerTask({ id: 'test', run: async () => {} });
    expect(ops.listTasks().length).toBe(1);
  });

  it('unregisters tasks', () => {
    ops.registerTask({ id: 'test', run: async () => {} });
    ops.unregisterTask('test');
    expect(ops.listTasks().length).toBe(0);
  });

  it('runs tasks on start', async () => {
    const run = jest.fn(async () => {});
    ops.registerTask({ id: 'run-task', run });
    ops.start();
    await new Promise((r) => setTimeout(r, 200));
    expect(run).toHaveBeenCalled();
  });

  it('respects interval', async () => {
    const run = jest.fn(async () => {});
    ops.registerTask({ id: 'interval-task', run, interval: 500 });
    ops.start();
    await new Promise((r) => setTimeout(r, 1200));
    expect(run.mock.calls.length).toBeLessThanOrEqual(3);
  });

  it('respects condition', async () => {
    const run = jest.fn(async () => {});
    let allow = false;
    ops.registerTask({ id: 'cond-task', run, condition: () => allow });
    ops.start();
    await new Promise((r) => setTimeout(r, 200));
    expect(run).not.toHaveBeenCalled();
    allow = true;
    await new Promise((r) => setTimeout(r, 200));
    expect(run).toHaveBeenCalled();
  });

  it('emits heartbeat and triggers selfHeal', async () => {
    const heartbeatListener = jest.fn();
    ops.on('heartbeat', heartbeatListener);
    ops.start();
    await new Promise((r) => setTimeout(r, 1100));
    expect(heartbeatListener).toHaveBeenCalled();
    expect(kernel.selfHeal).toHaveBeenCalled();
  });

  it('registers plugins', () => {
    const plugin = jest.fn();
    ops.plugin('test-plugin', plugin);
    expect(plugin).toHaveBeenCalledWith(ops);
  });
}); 