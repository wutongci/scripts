#!/usr/bin/env bash
# setup the base folders that we read the configmap from and the folder where the html content is served from
CONFIG_DIR="/eflabs/config"
ASSETS_DIR="/usr/share/nginx/html"
echo "Running replacements..."
# source the env vars
source ${CONFIG_DIR}/env-vars
# setup some debug flags
debug_sed=false
debug_ccl=false
# optional command to list assets files
assets_command="find ${ASSETS_DIR} -type f -name *.html -o -name *.js -o -name *.css"
# setup a base sed command string
SED="sed -i"
# setup replacement strings that will be appended to
SED_STRING=""
CCL_STRING=""
while getopts "a:d:" opt; do
  case $opt in
    a)
      assets_command=$OPTARG
    ;;
    d)
	  if [[ $OPTARG == "sed" ]];
	  then
	    debug_sed=true;
	  fi
	  if [[ $OPTARG == "ccl" ]];
	  then
	    debug_ccl=true;
	  fi
    ;;
  esac
done
# define our functions up front
# escape special chars - be careful when doing this with env vars, which are needed in single quotes for sed
escape_bash() {
  local val=${1}
  val="${val//\!/\\!}"
  # anything matching this regex should be an env var. we don't want to escape the single quotes on these as they are needed by sed to interpret them as env vars.
  # doing this regex match in two steps due to all of these characters being special characters.
  env_var_regex_1='#.*#'
  env_var_regex_2='$'
  if [[ ${val} =~ ${env_var_regex_1} ]]; then
    if [[ ${val} =~ ${env_var_regex_2} ]]; then
      val=${val//#/\'}
    fi
  else
    val="${val//\'/\\x27}"
  fi
  # this will simulate returning the new values as long as when calling it,
  # you use the $() syntax to capture the output of the echo
  echo ${val}
}
get_assets_files() {
  local files=""
  local counter=0
  for file in $(ASSETS_DIR=${ASSETS_DIR} ${assets_command}); do
    files[${counter}]=${file}
    counter=$((${counter}+1))
  done
  echo ${files[@]}
}
remove_surrounding_double_quotes() {
  local val=${1}
  val="${val%\"}"
  val="${val#\"}"
  echo ${val}
}
# only do this if debug is true
min_replace() {
    echo -e "\nReplacing .min dependencies"
    for file in "${all_assets_files_array[@]}"; do
      eval "sed -i 's|\.min\.css|.css|g' ${file}"
      eval "sed -i 's|\.min\.js|.js|g' ${file}"
    done
}
echo "Processing CCL replacements..."
# append the surrounding CCL string to each ccl replacement
while read key val
  do :
  key=$(escape_bash ${key})
  key=$(remove_surrounding_double_quotes ${key})
  val=$(escape_bash ${val})
  val=$(remove_surrounding_double_quotes ${val})
  val="${val%"${val##*[![:space:]]}"}" # strip trailing spaces
  if [[ ${val} == "''" ]];
    then
      val="\"\"";
  fi
  CCL_STRING="${CCL_STRING} -e 's~\({CCL:\|getCCL::\)${key}}\?~${val}~gI'"
done < <(cat ${CONFIG_DIR}/ccl-replacements | sort -r)
# make the final sed ccl replace statement
CCL_STRING="${SED}${CCL_STRING}"
if $debug_ccl ; then
  echo "final ccl sed string = ${CCL_STRING}"
fi
echo "Processing sed replacements..."
# build the sed string - make newlines the separator
while IFS=$'\n' read -a line
  # convert each line into an array
  do :
  line_array=(${line})
  # escape and read each element into key/val vars
  key=$(escape_bash ${line_array[0]});
  key=$(remove_surrounding_double_quotes ${key})
  val=$(escape_bash ${line_array[1]});
  val=$(remove_surrounding_double_quotes ${val})
  SED_STRING="${SED_STRING} -e 's|${key}|${val}|g'"
done < ${CONFIG_DIR}/sed-replacements
# make the final sed replace statement
SED_STRING="${SED}${SED_STRING}"
if $debug_sed ; then
  echo "final shared sed string = ${SED_STRING}"
fi
all_assets_files=$(get_assets_files)
all_assets_files_array=(${all_assets_files})
echo "total number of assets files is ${#all_assets_files_array[@]}"
echo "Running sed replacements & ccl replacements on assets files..."
# run sed and ccl replacements
for file in "${all_assets_files_array[@]}"
do
  if $debug_sed ; then
    echo "${SED_STRING} ${file}"
  fi
  eval ${SED_STRING} ${file}
  if $debug_ccl ; then
    echo "${CCL_STRING} ${file}"
  fi
  eval ${CCL_STRING} ${file}
done
# if the debug flag is set, then do a min replace
if [ "${ef_debug}" == "true" ]; then
  echo "Running min replace..."
  min_replace
else
  echo "Skipping min replace."
fi
echo "Replacements have finished running! Starting nginx."
# nginx -g 'daemon off;'
