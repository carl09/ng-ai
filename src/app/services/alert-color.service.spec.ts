import { AlertColorService } from './alert-color.service';

describe('AlertColorService', () => {
  let service: AlertColorService;

  beforeEach(() => {
    service = new AlertColorService();
  });
  describe('mapFromRbg', () => {
    it('test 255', () => {
      const x = service.mapFromRbg(255);

      expect(x).toBe(1);
    });

    it('test 254', () => {
      const x = service.mapFromRbg(254);

      expect(x).toBe(0.996078431372549);
    });

    it('test 1', () => {
      const x = service.mapFromRbg(1);

      expect(x).toBe(0.00392156862745098);
    });

    it('test 0', () => {
      const x = service.mapFromRbg(0);

      expect(x).toBe(0);
    });
  });

  describe('mapToRbg', () => {
    it('test 255', () => {
      const x = service.mapToRbg(1);

      expect(x).toBe(255);
    });

    it('test 254', () => {
      const x = service.mapToRbg(0.996078431372549);

      expect(x).toBe(254);
    });

    it('test 1', () => {
      const x = service.mapToRbg(0.00392156862745098);

      expect(x).toBe(1);
    });

    it('test 0', () => {
      const x = service.mapToRbg(0);

      expect(x).toBe(0);
    });
  });
});
