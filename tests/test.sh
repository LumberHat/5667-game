RESULT_EXPECTED="PASS"
RESULT_ACTUAL=$(python runtests.py)
if [[ $RESULT_EXPECTED == $RESULT_ACTUAL ]]; then
  echo "Result test passed"
else
  echo "Result test failed. Expected: $RESULT_EXPECTED Actual: $RESULT_ACTUAL"; exit 1;
fi