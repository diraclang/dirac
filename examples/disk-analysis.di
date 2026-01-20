<dirac>
  <!-- Get disk usage and ask LLM to summarize -->
  <output>Analyzing disk usage...</output>
  <output>&#10;</output>
  
  <llm>
    <system>du -sh . 2>/dev/null</system>
    <system>df -h . | tail -1</system>
    
    Above are two commands:
    1. Total size of current directory
    2. Disk space information for the filesystem
    
    Please tell me in one sentence: How much space is this directory using and what percentage of the disk is free?
  </llm>
</dirac>
