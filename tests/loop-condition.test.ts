/**
 * Unit tests for <loop> tag with condition support
 */

import { describe, it, expect } from '@jest/globals';
import { execute } from '../index.js';

describe('Loop Tag', () => {
  describe('Count-based loops (existing functionality)', () => {
    it('should loop fixed number of times', async () => {
      const dirac = `
        <dirac>
          <defvar name="result" value="" />
          <loop count="3">
            <assign name="result">
              <variable name="result" />x
            </assign>
          </loop>
          <output><variable name="result" /></output>
        </dirac>
      `;
      
      const output = await execute(dirac);
      expect(output.trim()).toBe('xxx');
    });

    it('should use custom loop variable', async () => {
      const dirac = `
        <dirac>
          <defvar name="sum" value="0" />
          <loop count="5" var="idx">
            <assign name="sum">
              <expr eval="plus">
                <arg><variable name="sum" /></arg>
                <arg><variable name="idx" /></arg>
              </expr>
            </assign>
          </loop>
          <output><variable name="sum" /></output>
        </dirac>
      `;
      
      const output = await execute(dirac);
      expect(output.trim()).toBe('10'); // 0+1+2+3+4 = 10
    });

    it('should support variable substitution in count', async () => {
      const dirac = `
        <dirac>
          <defvar name="n" value="4" />
          <defvar name="result" value="" />
          <loop count="\${n}">
            <assign name="result">
              <variable name="result" />y
            </assign>
          </loop>
          <output><variable name="result" /></output>
        </dirac>
      `;
      
      const output = await execute(dirac);
      expect(output.trim()).toBe('yyyy');
    });

    it('should support break statement', async () => {
      const dirac = `
        <dirac>
          <defvar name="result" value="" />
          <loop count="10">
            <if condition="\${i} == 3">
              <break />
            </if>
            <assign name="result">
              <variable name="result" /><variable name="i" />
            </assign>
          </loop>
          <output><variable name="result" /></output>
        </dirac>
      `;
      
      const output = await execute(dirac);
      expect(output.trim()).toBe('012');
    });
  });

  describe('Condition-based loops (new functionality)', () => {
    it('should loop while condition is true', async () => {
      const dirac = `
        <dirac>
          <defvar name="counter" value="0" />
          <defvar name="running" value="true" />
          <defvar name="result" value="" />
          
          <loop condition="\${running}">
            <assign name="result">
              <variable name="result" />x
            </assign>
            <assign name="counter">
              <expr eval="plus">
                <arg><variable name="counter" /></arg>
                <arg>1</arg>
              </expr>
            </assign>
            <if condition="\${counter} == 5">
              <assign name="running" value="false" />
            </if>
          </loop>
          
          <output><variable name="result" /></output>
        </dirac>
      `;
      
      const output = await execute(dirac);
      expect(output.trim()).toBe('xxxxx');
    });

    it('should stop when condition becomes false', async () => {
      const dirac = `
        <dirac>
          <defvar name="count" value="0" />
          <defvar name="keepGoing" value="true" />
          <defvar name="iterations" value="0" />
          
          <loop condition="\${keepGoing}">
            <assign name="iterations">
              <expr eval="plus">
                <arg><variable name="iterations" /></arg>
                <arg>1</arg>
              </expr>
            </assign>
            <if condition="\${iterations} == 3">
              <assign name="keepGoing" value="false" />
            </if>
          </loop>
          
          <output><variable name="iterations" /></output>
        </dirac>
      `;
      
      const output = await execute(dirac);
      expect(output.trim()).toBe('3');
    });

    it('should handle false condition immediately', async () => {
      const dirac = `
        <dirac>
          <defvar name="shouldRun" value="false" />
          <defvar name="result" value="not executed" />
          
          <loop condition="\${shouldRun}">
            <assign name="result" value="executed" />
          </loop>
          
          <output><variable name="result" /></output>
        </dirac>
      `;
      
      const output = await execute(dirac);
      expect(output.trim()).toBe('not executed');
    });
  });

  describe('Combined count and condition', () => {
    it('should stop at count limit even if condition is true', async () => {
      const dirac = `
        <dirac>
          <defvar name="running" value="true" />
          <defvar name="result" value="" />
          
          <loop count="3" condition="\${running}">
            <assign name="result">
              <variable name="result" />x
            </assign>
          </loop>
          
          <output><variable name="result" /></output>
        </dirac>
      `;
      
      const output = await execute(dirac);
      expect(output.trim()).toBe('xxx');
    });

    it('should stop at condition false even if count not reached', async () => {
      const dirac = `
        <dirac>
          <defvar name="running" value="true" />
          <defvar name="result" value="" />
          
          <loop count="10" condition="\${running}">
            <assign name="result">
              <variable name="result" />x
            </assign>
            <if condition="\${i} == 2">
              <assign name="running" value="false" />
            </if>
          </loop>
          
          <output><variable name="result" /></output>
        </dirac>
      `;
      
      const output = await execute(dirac);
      expect(output.trim()).toBe('xxx');
    });
  });

  describe('Error handling', () => {
    it('should throw error if neither count nor condition provided', async () => {
      const dirac = `
        <dirac>
          <loop>
            <output>test</output>
          </loop>
        </dirac>
      `;
      
      await expect(execute(dirac)).rejects.toThrow('requires either count or condition');
    });

    it('should throw error for invalid count', async () => {
      const dirac = `
        <dirac>
          <loop count="abc">
            <output>test</output>
          </loop>
        </dirac>
      `;
      
      await expect(execute(dirac)).rejects.toThrow('Invalid loop count');
    });
  });

  describe('Real-world use cases', () => {
    it('should work for monitoring/service pattern', async () => {
      const dirac = `
        <dirac>
          <defvar name="checks" value="0" />
          <defvar name="running" value="true" />
          <defvar name="log" value="" />
          
          <loop condition="\${running}">
            <assign name="log">
              <variable name="log" />check<variable name="checks" />;
            </assign>
            <assign name="checks">
              <expr eval="plus">
                <arg><variable name="checks" /></arg>
                <arg>1</arg>
              </expr>
            </assign>
            <if condition="\${checks} == 5">
              <assign name="running" value="false" />
            </if>
          </loop>
          
          <output><variable name="log" /></output>
        </dirac>
      `;
      
      const output = await execute(dirac);
      expect(output.trim()).toBe('check0;check1;check2;check3;check4;');
    });

    it('should work with break in condition loop', async () => {
      const dirac = `
        <dirac>
          <defvar name="running" value="true" />
          <defvar name="count" value="0" />
          
          <loop condition="\${running}">
            <assign name="count">
              <expr eval="plus">
                <arg><variable name="count" /></arg>
                <arg>1</arg>
              </expr>
            </assign>
            <if condition="\${count} == 3">
              <break />
            </if>
          </loop>
          
          <output><variable name="count" /></output>
        </dirac>
      `;
      
      const output = await execute(dirac);
      expect(output.trim()).toBe('3');
    });
  });
});
