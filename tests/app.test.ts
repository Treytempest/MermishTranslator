/// <reference types="jest" />
import request from 'supertest';
import { app, translate } from '../app';
import { Translator } from '../functions/translator';

jest.mock('../functions/translator', () => {
  return {
    Translator: jest.fn().mockImplementation(() => {
      return {
        translateWords: jest.fn().mockReturnValue('wiiba'),
        translateSymbols: jest.fn().mockReturnValue('ψఒ𐠂ψ'),
      };
    }),
  };
});

describe('GET Tests', () => {
  // Root path test
  it('Get translation page', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Translator');
  });
  // Admin login path test
  it('Get admin login page', async () => {
    const res = await request(app).get('/admin');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Admin Login');
  });
  // Admin portal NOT LOGGED IN test
  it('Get 403 error for admin portal while not logged in', async () => {
    const res = await request(app).get('/admin/portal');
    expect(res.statusCode).toEqual(403);
    expect(res.text).toContain('Forbidden');
  });
});

describe('POST Tests', () => {
  it('Submit translation form', async () => {
    const req = {
      body: { 
        lastUpdated: 'englishText', 
        englishText: 'test',
        angloText: '',
        mermishText: ''
      },
    };
    const res = { render: jest.fn(), };
    const next = jest.fn();
    translate(req as any, res as any, next);
    expect(res.render).toHaveBeenCalledWith('translator', {
      englishText: 'test',
      angloText: 'wiiba',
      mermishText: 'ψఒ𐠂ψ',
    });
  });

});