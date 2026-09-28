<!-- TEST: install_local_ai_dry_run -->
<!-- EXPECT:
Installing local AI companion from ~/diraclang/dirac-llm
Planned command: cd ~/diraclang/dirac-llm && bash setup.sh
Next: source ~/diraclang/dirac-llm/.venv/bin/activate
Next: python ~/diraclang/dirac-llm/mlx/python_script/stateless_chat_server_train_qwen.py
-->
<dirac>
  <import src="../lib/install-local-ai.di" />
  <install-local-ai dryRun="true" />
</dirac>