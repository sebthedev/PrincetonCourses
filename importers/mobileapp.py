# ----------------------------------------------------------------------
# mobileapp.py
# Contains MobileApp, a class used to communicate with the MobileApp API
# from the Princeton OIT.
# Credit: vr2amesh https://github.com/vr2amesh/COS333-API-Code-Examples
# ----------------------------------------------------------------------

import requests
import json
import base64
from json import dumps
from os import environ
from sys import argv, stdout


CONSUMER_KEY = environ['CONSUMER_KEY']
CONSUMER_SECRET = environ['CONSUMER_SECRET']


class MobileApp:

    def __init__(self):
        self.configs = Configs()

    # wrapper function for _getJSON with the courses/courses endpoint.
    # kwargs must contain key "term" with the current term code, as well
    # as one or more of "subject" (department code) and "search" (course
    # title)

    def get_courses(self, args):
        return self._getJSON(self.configs.COURSE_COURSES, args)

    # returns a commma-separated string of all department codes

    def get_all_dept_codes_csv(self):
        data = self._getJSON(self.configs.COURSE_COURSES, 'subject=list')
        return ','.join([e['code'] for e in data['term'][0]['subjects']])

    # returns a raw JSON of all department codes

    def get_all_dept_codes_json(self):
        return self._getJSON(self.configs.COURSE_COURSES, 'subject=list')

    '''
    This function allows a user to make a request to 
    a certain endpoint, with the BASE_URL of 
    https://api.princeton.edu:443/mobile-app

    The parameters kwargs are keyword arguments. It
    symbolizes a variable number of arguments 
    '''

    def _getJSON(self, endpoint, args):
        req = requests.get(
            self.configs.BASE_URL + endpoint + '?fmt=json&' + args,
            headers={
                "Authorization": "Bearer " + self.configs.ACCESS_TOKEN
            },
        )
        text = req.text

        # Check to see if the response failed due to invalid credentials
        text = self._updateConfigs(text, endpoint, args)

        return json.loads(text)

    def _updateConfigs(self, text, endpoint, args):
        if text.startswith("<ams:fault"):
            self.configs._refreshToken(grant_type="client_credentials")

            # Redo the request with the new access token
            req = requests.get(
                self.configs.BASE_URL + endpoint + '?fmt=json&' + args,
                headers={
                    "Authorization": "Bearer " + self.configs.ACCESS_TOKEN
                },
            )
            text = req.text

        return text


class Configs:
    def __init__(self):
        self.CONSUMER_KEY = CONSUMER_KEY
        self.CONSUMER_SECRET = CONSUMER_SECRET
        self.BASE_URL = 'https://api.princeton.edu:443/mobile-app'
        self.COURSE_COURSES = '/courses/courses'
        self.REFRESH_TOKEN_URL = 'https://api.princeton.edu:443/token'
        self._refreshToken(grant_type='client_credentials')

    def _refreshToken(self, **kwargs):
        req = requests.post(
            self.REFRESH_TOKEN_URL,
            data=kwargs,
            headers={
                'Authorization': 'Basic ' + base64.b64encode(bytes(self.CONSUMER_KEY + ':' + self.CONSUMER_SECRET, 'utf-8')).decode('utf-8')
            },
        )
        text = req.text
        response = json.loads(text)
        self.ACCESS_TOKEN = response['access_token']


def main():
    api = MobileApp()
    if argv[1] == 'importBasicCourseDetails':
        all_codes = api.get_all_dept_codes_csv()
        '''
        Add "&term=<TERM_CODE>" to the string below if you need to process
        courses from a specific term. For example, if you want to process
        courses from term code 1222, the below line would be:

        args = argv[2] if len(argv) > 2 else f'subject={all_codes}&term=1222'

        Be sure to REVERT this change when done processing new courses!
        '''
        args = argv[2] if len(argv) > 2 else f'subject={all_codes}'
        print(dumps(api.get_courses(args)))
    elif argv[1] == 'importDepartmentals':
        print(dumps(api.get_all_dept_codes_json()))
    stdout.flush()


if __name__ == '__main__':
    main()
